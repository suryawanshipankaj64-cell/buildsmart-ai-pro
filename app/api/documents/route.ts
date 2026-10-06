import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestAuth } from '@/lib/userAuth';

// In-memory versioned document store backed by database project references
interface DocumentRecord {
  id: string;
  projectId: string;
  projectName?: string;
  title: string;
  category: 'PLANS' | 'PERMITS' | 'CONTRACTS' | 'BILLS';
  fileName: string;
  fileSize: string;
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
  roleVisibility: Array<'ADMIN' | 'ENGINEER' | 'CONTRACTOR' | 'CUSTOMER'>;
  tags: string[];
  history: Array<{
    version: string;
    date: string;
    changedBy: string;
    note: string;
  }>;
}

// Initial seed documents for projects
let documentsStore: DocumentRecord[] = [
  {
    id: 'doc-101',
    projectId: 'seed-project-1',
    title: 'Architectural Blueprint - Structural Slab Level 3',
    category: 'PLANS',
    fileName: 'Structural_Blueprint_L3_Rev4.pdf',
    fileSize: '14.2 MB',
    version: 'v4.2',
    uploadedBy: 'Rajesh Sharma (Lead Site Engineer)',
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://buildsmart.ai/storage/plans/blueprint-l3-v4.pdf',
    roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
    tags: ['RCC', 'Structural', 'Level 3', 'Approved'],
    history: [
      { version: 'v4.2', date: '2 days ago', changedBy: 'Rajesh Sharma', note: 'Reinforcement bar spacing adjustment per structural audit.' },
      { version: 'v4.1', date: '10 days ago', changedBy: 'Sarah Connor', note: 'Shear wall reinforcement alignment.' },
      { version: 'v1.0', date: '1 month ago', changedBy: 'Pankaj Suryawanshi', note: 'Initial structural design submission.' },
    ],
  },
  {
    id: 'doc-102',
    projectId: 'seed-project-1',
    title: 'Municipal Corporation Environmental Clearance & NOC',
    category: 'PERMITS',
    fileName: 'Municipal_NOC_Fire_Pollution.pdf',
    fileSize: '3.8 MB',
    version: 'v1.0',
    uploadedBy: 'Pankaj Suryawanshi (Executive Admin)',
    uploadedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://buildsmart.ai/storage/permits/municipal-noc.pdf',
    roleVisibility: ['ADMIN', 'ENGINEER'],
    tags: ['Compliance', 'Fire Safety', 'Govt Approved'],
    history: [
      { version: 'v1.0', date: '15 days ago', changedBy: 'Pankaj Suryawanshi', note: 'Final approved sanction from Local Town Planning.' },
    ],
  },
  {
    id: 'doc-103',
    projectId: 'seed-project-1',
    title: 'Civil Contractor Master Service Agreement (MSA)',
    category: 'CONTRACTS',
    fileName: 'MSA_Civil_Contractor_Executed.pdf',
    fileSize: '5.1 MB',
    version: 'v2.1',
    uploadedBy: 'Sarah Connor (Senior PM)',
    uploadedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://buildsmart.ai/storage/contracts/msa-civil.pdf',
    roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR'],
    tags: ['Legal', 'Milestone Linked', 'Signed'],
    history: [
      { version: 'v2.1', date: '20 days ago', changedBy: 'Sarah Connor', note: 'Added penalty clause for delayed aggregate supply.' },
    ],
  },
  {
    id: 'doc-104',
    projectId: 'seed-project-1',
    title: 'UltraTech Cement Batch 45 Tax Invoice & Delivery Challan',
    category: 'BILLS',
    fileName: 'Invoice_UltraTech_500Bags_Oct.pdf',
    fileSize: '1.2 MB',
    version: 'v1.0',
    uploadedBy: 'Rajesh Sharma (Lead Site Engineer)',
    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://buildsmart.ai/storage/bills/ultratech-inv-45.pdf',
    roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
    tags: ['Material', 'Cement', 'GST Paid', 'Verified On-Site'],
    history: [
      { version: 'v1.0', date: '3 days ago', changedBy: 'Rajesh Sharma', note: 'Uploaded with physical weighbridge slip.' },
    ],
  },
  {
    id: 'doc-105',
    projectId: 'seed-project-2',
    title: 'MEP Electrical Single Line Diagram (SLD)',
    category: 'PLANS',
    fileName: 'MEP_Electrical_SLD_Phase2.dwg.pdf',
    fileSize: '8.7 MB',
    version: 'v2.0',
    uploadedBy: 'Rajesh Sharma (Lead Site Engineer)',
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://buildsmart.ai/storage/plans/mep-sld-v2.pdf',
    roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR'],
    tags: ['MEP', 'Electrical', 'Phase 2'],
    history: [
      { version: 'v2.0', date: '5 days ago', changedBy: 'Rajesh Sharma', note: 'Transformer capacity upgrade from 250kVA to 315kVA.' },
    ],
  },
];

export async function GET(req: Request) {
  try {
    const auth = await getRequestAuth(req);
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase();

    // Dynamically assign actual project IDs from database if documents are unbound
    const dbProjects = await prisma.project.findMany({ select: { id: true, name: true, userId: true } });
    if (dbProjects.length > 0) {
      const defaultId = dbProjects[0].id;
      documentsStore.forEach((doc, idx) => {
        if (doc.projectId.startsWith('seed-')) {
          const target = dbProjects[idx % dbProjects.length];
          doc.projectId = target.id;
          doc.projectName = target.name;
        }
      });
    }

    let filtered = documentsStore;

    // Isolate documents if client
    if (auth.isClient && auth.userId) {
      const clientProjIds = new Set(dbProjects.filter(p => p.userId === auth.userId).map(p => p.id));
      filtered = filtered.filter(doc => clientProjIds.has(doc.projectId));
    }

    if (projectId && projectId !== 'all') {
      filtered = filtered.filter(doc => doc.projectId === projectId);
    }

    if (category && category !== 'ALL') {
      filtered = filtered.filter(doc => doc.category.toUpperCase() === category.toUpperCase());
    }

    if (search) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(search) ||
        doc.fileName.toLowerCase().includes(search) ||
        doc.tags.some(t => t.toLowerCase().includes(search))
      );
    }

    return NextResponse.json(filtered);
  } catch (error: any) {
    console.error('GET_DOCUMENTS_ERROR:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch documents.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getRequestAuth(req);
    if (auth.isClient) {
      return NextResponse.json(
        { error: 'Permission denied. Clients have read-only access and cannot upload documents.' },
        { status: 403 }
      );
    }
    const body = await req.json();
    const {
      projectId,
      title,
      category = 'PLANS',
      fileName,
      fileSize = '2.5 MB',
      version = 'v1.0',
      uploadedBy = 'Site Engineer',
      roleVisibility = ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
      tags = [],
      url = 'https://buildsmart.ai/storage/documents/sample.pdf',
    } = body;

    if (!projectId || !title?.trim() || !fileName?.trim()) {
      return NextResponse.json(
        { error: 'Project ID, Document Title, and File Name are required.' },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    const newDoc: DocumentRecord = {
      id: `doc-${Date.now()}`,
      projectId,
      projectName: project?.name || 'Active Project',
      title: title.trim(),
      category: category.toUpperCase() as any,
      fileName: fileName.trim(),
      fileSize,
      version: version.startsWith('v') ? version : `v${version}`,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      url,
      roleVisibility: Array.isArray(roleVisibility) ? roleVisibility : ['ADMIN', 'ENGINEER', 'CONTRACTOR'],
      tags: Array.isArray(tags) ? tags : [category],
      history: [
        {
          version: version.startsWith('v') ? version : `v${version}`,
          date: 'Just now',
          changedBy: uploadedBy,
          note: 'Initial mobile document upload and verification.',
        },
      ],
    };

    documentsStore.unshift(newDoc);

    // Create a notification for project tracking
    try {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        await prisma.notification.create({
          data: {
            userId: firstUser.id,
            projectId,
            type: 'DOCUMENT_UPLOADED',
            message: `New ${category} document uploaded: "${title}" (${version})`,
          },
        });
      }
    } catch {}

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error: any) {
    console.error('CREATE_DOCUMENT_ERROR:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload document.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await getRequestAuth(req);
    if (auth.isClient) {
      return NextResponse.json(
        { error: 'Permission denied. Clients have read-only access and cannot delete documents.' },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required.' }, { status: 400 });
    }

    const initialLength = documentsStore.length;
    documentsStore = documentsStore.filter(d => d.id !== id);

    if (documentsStore.length === initialLength) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Document deleted successfully.' });
  } catch (error: any) {
    console.error('DELETE_DOCUMENT_ERROR:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete document.' }, { status: 500 });
  }
}

