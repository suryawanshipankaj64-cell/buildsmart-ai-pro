import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestAuth } from '@/lib/userAuth';

// GET: Fetch all expenses (or filter by projectId query param & client ownership)
export async function GET(req: Request) {
  try {
    const auth = await getRequestAuth(req);
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    let whereClause: any = {};
    if (projectId) {
      whereClause.projectId = projectId;
    }
    if (auth.isClient && auth.userId) {
      whereClause.project = { userId: auth.userId };
    }

    const expenses = await prisma.expense.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {
        project: {
          select: { name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(expenses);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch expenses' }, { status: 500 });
  }
}

// POST: Log an expense
export async function POST(req: Request) {
  try {
    const auth = await getRequestAuth(req);
    if (auth.isClient) {
      return NextResponse.json(
        { error: 'Permission denied. Clients have read-only access and cannot log direct expenses.' },
        { status: 403 }
      );
    }
    const body = await req.json();
    const { projectId, category, itemName, amount, date } = body;

    if (!projectId || !itemName?.trim() || amount === undefined || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: Project, Item Name, Amount, and Date.' },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        projectId,
        category: (category || 'MATERIAL').toUpperCase(),
        itemName: itemName.trim(),
        amount: parseFloat(amount) || 0, // Must be numeric Float
        date: new Date(date),             // Must be a valid Date object
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error('CREATE_EXPENSE_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to log expense' },
      { status: 500 }
    );
  }
}