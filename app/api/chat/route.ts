import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/prisma';

const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
];

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messages, message, prompt, query, projectId } = body;

    // 1. Extract the latest user query
    let userQuery = '';
    if (Array.isArray(messages) && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      userQuery = typeof lastMsg === 'string' ? lastMsg : lastMsg?.content || '';
    } else {
      userQuery = message || prompt || query || '';
    }

    if (!userQuery.trim()) {
      return NextResponse.json(
        { error: 'Please enter a message to send.' },
        { status: 400 }
      );
    }

    // 2. Fetch live project data from database
    let projectContext = '';
    let selectedProjectData: any = null;
    let allProjectsData: any[] = [];

    if (projectId && projectId !== 'all') {
      selectedProjectData = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          estimate: true,
          expenses: true,
          tasks: true,
        },
      }).catch(() => null);

      if (selectedProjectData) {
        const spent = (selectedProjectData.expenses || []).reduce((s: number, e: any) => s + e.amount, 0);
        const totalBudget = selectedProjectData.estimate?.totalEstimatedCost || selectedProjectData.budget || 0;
        const completedTasks = (selectedProjectData.tasks || []).filter((t: any) => t.isCompleted).length;
        const totalTasks = (selectedProjectData.tasks || []).length;

        const expensesList = (selectedProjectData.expenses || [])
          .slice(0, 15)
          .map((e: any) => `- [${e.category}] ${e.itemName}: ₹${e.amount.toLocaleString('en-IN')} on ${new Date(e.date).toISOString().split('T')[0]}`)
          .join('\n');

        const tasksList = (selectedProjectData.tasks || [])
          .slice(0, 20)
          .map((t: any) => `- Task: "${t.title}" | Phase: ${t.phaseName} | Status: ${t.isCompleted ? 'Completed' : `In Progress (${Math.round(t.progressPercent || 0)}%)`} | Due: ${new Date(t.dueDate).toISOString().split('T')[0]}`)
          .join('\n');

        projectContext = `
ACTIVE PROJECT DETAILS:
- Name: ${selectedProjectData.name}
- Location: ${selectedProjectData.location}
- Status: ${selectedProjectData.status}
- Physical Progress: ${Math.round(selectedProjectData.progressPercent || 0)}%
- Total Budget: ₹${totalBudget.toLocaleString('en-IN')}
- Spent to Date: ₹${spent.toLocaleString('en-IN')} (Remaining: ₹${(totalBudget - spent).toLocaleString('en-IN')})
- Built-Up Slab Area: ${(selectedProjectData.builtUpAreaSqFt || 0).toLocaleString('en-IN')} sq.ft
- Task Completion: ${completedTasks} completed of ${totalTasks} total tasks

ESTIMATES & MATERIAL TAKEOFF:
${
  selectedProjectData.estimate
    ? `- Cement: ${selectedProjectData.estimate.cementBags?.toLocaleString('en-IN')} bags
- TMT Steel: ${selectedProjectData.estimate.steelKg?.toLocaleString('en-IN')} kg
- River Sand: ${selectedProjectData.estimate.sandCft?.toLocaleString('en-IN')} CFT
- Aggregate: ${selectedProjectData.estimate.aggregateCft?.toLocaleString('en-IN')} CFT
- Bricks: ${selectedProjectData.estimate.bricksCount?.toLocaleString('en-IN')} pcs
- Masons: ${selectedProjectData.estimate.masonCount}, Helpers: ${selectedProjectData.estimate.helperCount}
- Estimated Total Cost: ₹${selectedProjectData.estimate.totalEstimatedCost?.toLocaleString('en-IN')}`
    : 'Standard civil estimates apply for built-up area.'
}

RECENT EXPENSES:
${expensesList || 'No expenses logged yet.'}

ACTIVE TASKS & PHASES:
${tasksList || 'No tasks created yet.'}
`;
      }
    } else {
      allProjectsData = await prisma.project.findMany({
        include: {
          expenses: true,
          tasks: true,
          estimate: true,
        },
      }).catch(() => []);

      projectContext = `
ALL ACTIVE SITES & PROJECTS SUMMARY:
${allProjectsData
  .map((p) => {
    const pSpent = (p.expenses || []).reduce((s: number, e: any) => s + e.amount, 0);
    const pBudget = p.estimate?.totalEstimatedCost || p.budget || 0;
    const pCompleted = (p.tasks || []).filter((t: any) => t.isCompleted).length;
    return `- Project "${p.name}": Location: ${p.location}, Status: ${p.status}, Progress: ${Math.round(p.progressPercent || 0)}%, Budget: ₹${pBudget.toLocaleString('en-IN')}, Spent: ₹${pSpent.toLocaleString('en-IN')}, Tasks: ${pCompleted}/${(p.tasks || []).length} done`;
  })
  .join('\n')}
`;
    }

    // 3. System Instructions
    const systemInstruction = `You are BuildSmart AI, an expert civil engineering consultant, cost surveyor, and construction management assistant for BuildSmart AI Pro.

CRITICAL FORMATTING GUIDELINES:
- Output clean, professional GitHub-flavored Markdown.
- When comparing multiple projects or metrics, always format the summary in a clean Markdown Table (| Project | Location | Status | Progress | Budget | Spent |).
- Use clear section headers (### 📊 Project Status, ### 💰 Financial Summary, ### 🧱 Material Schedule, ### 🎯 Key Takeaways).
- Use bullet points with bold leading phrases (* **Milestones:** ...).
- Highlight key figures with bold rupee notation (e.g., **₹25,00,000**).
- Ground all facts directly in the live project database context provided below:

${projectContext}`;

    // 4. Try Google Gemini API with robust model fallback
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: userQuery,
            config: {
              systemInstruction,
              temperature: 0.6,
            },
          });

          if (response?.text) {
            return NextResponse.json({
              reply: response.text,
              provider: `Google Gemini (${modelName})`,
            });
          }
        } catch (modelErr: any) {
          console.warn(`[GEMINI_MODEL_FALLBACK] ${modelName} returned error:`, modelErr?.message || modelErr);
          // Continue to next model in fallback list
        }
      }
    }

    // 5. Intelligent Local Engineering Knowledge Fallback (Zero downtime if cloud API experiences temporary outage)
    const localReply = generateLocalOverviewReply(userQuery, selectedProjectData, allProjectsData);
    return NextResponse.json({
      reply: localReply,
      provider: 'BuildSmart AI Engine (Local Knowledge Synthesis)',
    });
  } catch (error: any) {
    console.error('CHAT_ROUTE_FATAL_ERROR:', error);
    return NextResponse.json(
      {
        reply: `### BuildSmart AI Project Overview\n\nI am currently analyzing your project database. Here is what is available:\n- Please select a project from the top dropdown or ask specific questions like *"What is the material requirement for my project?"* or *"What is our budget spent?"*.`,
      },
      { status: 200 }
    );
  }
}

// Fallback intelligent response builder
function generateLocalOverviewReply(query: string, project: any, allProjects: any[]): string {
  const q = query.toLowerCase();

  if (project) {
    const spent = (project.expenses || []).reduce((s: number, e: any) => s + e.amount, 0);
    const totalBudget = project.estimate?.totalEstimatedCost || project.budget || 0;
    const remaining = totalBudget - spent;
    const progress = Math.round(project.progressPercent || 0);
    const completedTasks = (project.tasks || []).filter((t: any) => t.isCompleted).length;
    const totalTasks = (project.tasks || []).length;

    if (q.includes('overview') || q.includes('status') || q.includes('summary') || q.includes('progress') || q.includes('current')) {
      return `### 🏗️ Project Overview: **${project.name}**

**General Site Summary:**
- **Location**: ${project.location}
- **Current Status**: **${project.status}** (${progress}% physical completion)
- **Built-Up Slab Area**: ${(project.builtUpAreaSqFt || 0).toLocaleString('en-IN')} sq.ft

**💰 Financial Status:**
- **Total Estimated Budget**: ₹${totalBudget.toLocaleString('en-IN')}
- **Total Spent to Date**: ₹${spent.toLocaleString('en-IN')} (${totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0}% burn rate)
- **Remaining Balance**: ₹${remaining.toLocaleString('en-IN')}

**📋 Tasks & Schedule:**
- **Completed Milestones**: ${completedTasks} of ${totalTasks} tasks completed (${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%)
- **Active Trade**: Civil Contractor

${
  project.estimate
    ? `**🧱 Key Material Requirements:**
- Cement: **${project.estimate.cementBags?.toLocaleString('en-IN')} bags**
- Fe-550D Steel: **${project.estimate.steelKg?.toLocaleString('en-IN')} kg**
- Sand / M-Sand: **${project.estimate.sandCft?.toLocaleString('en-IN')} CFT**
- Crushed Aggregate: **${project.estimate.aggregateCft?.toLocaleString('en-IN')} CFT**
- Bricks / Blocks: **${project.estimate.bricksCount?.toLocaleString('en-IN')} pcs**`
    : ''
}

*Feel free to ask for itemized expense breakdowns, required equipment schedules, or specific phase milestones!*`;
    }

    if (q.includes('cement') || q.includes('steel') || q.includes('material') || q.includes('sand') || q.includes('brick')) {
      if (project.estimate) {
        return `### 🧱 Material Takeoff for **${project.name}**:
- **OPC 43/53 Cement**: ${project.estimate.cementBags?.toLocaleString('en-IN')} Bags
- **Fe-550D TMT Steel**: ${project.estimate.steelKg?.toLocaleString('en-IN')} Kg
- **River / M-Sand**: ${project.estimate.sandCft?.toLocaleString('en-IN')} CFT
- **Coarse Aggregate**: ${project.estimate.aggregateCft?.toLocaleString('en-IN')} CFT
- **Bricks / AAC Blocks**: ${project.estimate.bricksCount?.toLocaleString('en-IN')} Pcs
- **Estimated Material Cost**: ₹${project.estimate.materialCost?.toLocaleString('en-IN') || 'Calculated per admin baseline'}`;
      }
    }

    if (q.includes('budget') || q.includes('expense') || q.includes('cost') || q.includes('spent') || q.includes('price')) {
      return `### 💰 Budget & Expense Analysis for **${project.name}**:
- **Baseline Estimated Budget**: ₹${totalBudget.toLocaleString('en-IN')}
- **Recorded Expenses**: ₹${spent.toLocaleString('en-IN')}
- **Remaining Balance**: ₹${remaining.toLocaleString('en-IN')}
- **Budget Health**: ${remaining >= 0 ? '✅ Within Planned Allocation' : '⚠️ Budget Variance Detected'}`;
    }
  }

  // All projects summary
  if (allProjects && allProjects.length > 0) {
    const totalSites = allProjects.length;
    const totalBudgetSum = allProjects.reduce((s, p) => s + (p.estimate?.totalEstimatedCost || p.budget || 0), 0);
    const totalSpentSum = allProjects.reduce((s, p) => s + (p.expenses || []).reduce((es: number, e: any) => es + e.amount, 0), 0);

    return `### 🏢 Platform-Wide Construction Overview (${totalSites} Active Sites)

**Portfolio Financials:**
- **Total Combined Budget**: ₹${totalBudgetSum.toLocaleString('en-IN')}
- **Total Combined Expenditure**: ₹${totalSpentSum.toLocaleString('en-IN')}
- **Portfolio Remaining Funds**: ₹${(totalBudgetSum - totalSpentSum).toLocaleString('en-IN')}

**Active Projects Summary:**
${allProjects
  .map(
    (p) =>
      `1. **${p.name}** (${p.location})
   - Status: **${p.status}** · Progress: **${Math.round(p.progressPercent || 0)}%**
   - Budget: ₹${(p.estimate?.totalEstimatedCost || p.budget || 0).toLocaleString('en-IN')} · Spent: ₹${(p.expenses || [])
        .reduce((es: number, e: any) => es + e.amount, 0)
        .toLocaleString('en-IN')}`
  )
  .join('\n\n')}

*To inspect specific material takeoff, equipment schedules, or expense logs for an individual site, select it from the **Project Scope** dropdown above.*`;
  }

  return `### 🛠️ BuildSmart AI Assistant
I am ready to assist with your construction management, quantity takeoff, budgeting, and project tracking queries. 
- Ask: *"What is the material requirement for my project?"*
- Ask: *"What is the current budget and expense summary?"*
- Ask: *"Show me the required equipment list."*`;
}