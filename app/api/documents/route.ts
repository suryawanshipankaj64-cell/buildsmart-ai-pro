import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestAuth } from '@/lib/userAuth';

// In-memory versioned document store backed by database project references
interface DocumentRecord {
  id: string;
  projectId: string;
  projectName?: string;
  phaseName?: string;
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
    phaseName: 'Superstructure & Masonry',
    title: 'Architectural Blueprint - Structural Slab Level 3',
    category: 'PLANS',
    fileName: 'Structural_Blueprint_L3_Rev4.pdf',
    fileSize: '14.2 MB',
    version: 'v4.2',
    uploadedBy: 'Site Engineer (Field Operations)',
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1200&q=80',
    roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
    tags: ['RCC', 'Structural', 'Level 3', 'Superstructure & Masonry', 'Approved'],
    history: [
      { version: 'v4.2', date: '2 days ago', changedBy: 'Site Engineer', note: 'Reinforcement bar spacing adjustment per structural audit.' },
      { version: 'v4.1', date: '10 days ago', changedBy: 'Sarah Connor', note: 'Shear wall reinforcement alignment.' },
      { version: 'v1.0', date: '1 month ago', changedBy: 'Pankaj Suryawanshi', note: 'Initial structural design submission.' },
    ],
  },
  {
    id: 'doc-102',
    projectId: 'seed-project-1',
    phaseName: 'Planning',
    title: 'Municipal Corporation Environmental Clearance & NOC',
    category: 'PERMITS',
    fileName: 'Municipal_NOC_Fire_Pollution.pdf',
    fileSize: '3.8 MB',
    version: 'v1.0',
    uploadedBy: 'Pankaj Suryawanshi (Executive Admin)',
    uploadedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
    tags: ['Planning', 'Compliance', 'Fire Safety', 'Govt Approved'],
    history: [
      { version: 'v1.0', date: '15 days ago', changedBy: 'Pankaj Suryawanshi', note: 'Final approved sanction from Local Town Planning.' },
    ],
  },
  {
    id: 'doc-103',
    projectId: 'seed-project-1',
    phaseName: 'Superstructure & Masonry',
    title: 'Civil Contractor Master Service Agreement (MSA)',
    category: 'CONTRACTS',
    fileName: 'MSA_Civil_Contractor_Executed.pdf',
    fileSize: '5.1 MB',
    version: 'v2.1',
    uploadedBy: 'Sarah Connor (Senior PM)',
    uploadedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
    roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
    tags: ['Legal', 'Superstructure & Masonry', 'Milestone Linked', 'Signed'],
    history: [
      { version: 'v2.1', date: '20 days ago', changedBy: 'Sarah Connor', note: 'Added penalty clause for delayed aggregate supply.' },
    ],
  },
  {
    id: 'doc-104',
    projectId: 'seed-project-1',
    phaseName: 'Substructure & Foundation',
    title: 'UltraTech Cement Batch 45 Tax Invoice & Delivery Challan',
    category: 'BILLS',
    fileName: 'Invoice_UltraTech_500Bags_Oct.pdf',
    fileSize: '1.2 MB',
    version: 'v1.0',
    uploadedBy: 'Site Engineer (Field Operations)',
    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
    tags: ['Substructure & Foundation', 'Material', 'Cement', 'GST Paid', 'Verified On-Site'],
    history: [
      { version: 'v1.0', date: '3 days ago', changedBy: 'Site Engineer', note: 'Uploaded with physical weighbridge slip.' },
    ],
  },
  {
    id: 'doc-105',
    projectId: 'seed-project-2',
    phaseName: 'Electrical Work',
    title: 'MEP Electrical Single Line Diagram (SLD)',
    category: 'PLANS',
    fileName: 'MEP_Electrical_SLD_Phase2.dwg.pdf',
    fileSize: '8.7 MB',
    version: 'v2.0',
    uploadedBy: 'Site Engineer (Field Operations)',
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
    roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
    tags: ['MEP', 'Electrical Work', 'Electrical', 'Phase 2'],
    history: [
      { version: 'v2.0', date: '5 days ago', changedBy: 'Site Engineer', note: 'Transformer capacity upgrade from 250kVA to 315kVA.' },
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

    const targetProjectId = (auth.isClient ? (auth.projectId || projectId) : projectId) || undefined;

    // Dynamically assign or generate actual project documents from database if needed
    const dbProjects = await prisma.project.findMany({ select: { id: true, name: true, userId: true } });
    if (dbProjects.length > 0) {
      documentsStore.forEach((doc, idx) => {
        if (doc.projectId.startsWith('seed-')) {
          const target = dbProjects[idx % dbProjects.length];
          doc.projectId = target.id;
          doc.projectName = target.name;
        }
      });

      // If a specific project was requested and has no documents yet, auto-seed standard phase documents
      const activeProjId = targetProjectId && targetProjectId !== 'all' ? targetProjectId : dbProjects[0].id;
      if (activeProjId && !documentsStore.some(d => d.projectId === activeProjId)) {
        const proj = dbProjects.find(p => p.id === activeProjId);
        const projName = proj?.name || 'Site Project';

        const phaseSeedDocs: DocumentRecord[] = [
          {
            id: `doc-${activeProjId}-1`,
            projectId: activeProjId,
            projectName: projName,
            phaseName: 'Planning',
            title: 'Architectural Master Plan & Elevation Blueprint',
            category: 'PLANS',
            fileName: 'Architectural_Master_Elevation.pdf',
            fileSize: '14.2 MB',
            version: 'v2.1',
            uploadedBy: 'Site Engineer (Field Operations)',
            uploadedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1200&q=80',
            roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
            tags: ['Planning', 'Architectural', 'Blueprint', 'Approved'],
            history: [{ version: 'v2.1', date: '6 days ago', changedBy: 'Site Engineer', note: 'Master plan architectural drawing.' }],
          },
          {
            id: `doc-${activeProjId}-2`,
            projectId: activeProjId,
            projectName: projName,
            phaseName: 'Planning',
            title: 'Town Planning Municipal Clearance & NOC',
            category: 'PERMITS',
            fileName: 'Municipal_NOC_Permit.pdf',
            fileSize: '3.4 MB',
            version: 'v1.0',
            uploadedBy: 'Executive Admin',
            uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
            roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
            tags: ['Planning', 'Permits', 'Sanction', 'Government Approved'],
            history: [{ version: 'v1.0', date: '10 days ago', changedBy: 'Executive Admin', note: 'Town planning sanction issued.' }],
          },
          {
            id: `doc-${activeProjId}-3`,
            projectId: activeProjId,
            projectName: projName,
            phaseName: 'Substructure & Foundation',
            title: 'Geotechnical Soil Investigation & Foundation Plan',
            category: 'PLANS',
            fileName: 'Soil_Investigation_Foundation_Slab.pdf',
            fileSize: '9.1 MB',
            version: 'v1.4',
            uploadedBy: 'Site Engineer (Field Operations)',
            uploadedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
            roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
            tags: ['Substructure & Foundation', 'Soil Test', 'Footing', 'PCC'],
            history: [{ version: 'v1.4', date: '8 days ago', changedBy: 'Site Engineer', note: 'Footing depth calculated per Safe Bearing Capacity (SBC).' }],
          },
          {
            id: `doc-${activeProjId}-4`,
            projectId: activeProjId,
            projectName: projName,
            phaseName: 'Superstructure & Masonry',
            title: 'Structural Slab & Column Reinforcement Details',
            category: 'PLANS',
            fileName: 'Structural_RCC_Reinforcement_Details.pdf',
            fileSize: '16.5 MB',
            version: 'v3.0',
            uploadedBy: 'Site Engineer (Field Operations)',
            uploadedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
            roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
            tags: ['Superstructure & Masonry', 'RCC', 'Columns', 'Structural'],
            history: [{ version: 'v3.0', date: '4 days ago', changedBy: 'Site Engineer', note: 'TMT steel bar spacing and lap lengths audited.' }],
          },
          {
            id: `doc-${activeProjId}-5`,
            projectId: activeProjId,
            projectName: projName,
            phaseName: 'Superstructure & Masonry',
            title: 'Civil Contractor Master Service Agreement (MSA)',
            category: 'CONTRACTS',
            fileName: 'Civil_Contractor_Executed_MSA.pdf',
            fileSize: '5.2 MB',
            version: 'v1.0',
            uploadedBy: 'Executive Admin',
            uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
            roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
            tags: ['Contracts', 'Superstructure & Masonry', 'Legal', 'Signed Agreement'],
            history: [{ version: 'v1.0', date: '14 days ago', changedBy: 'Executive Admin', note: 'Executed milestone-linked agreement.' }],
          },
          {
            id: `doc-${activeProjId}-6`,
            projectId: activeProjId,
            projectName: projName,
            phaseName: 'Plumbing Work',
            title: 'Water Supply Lines & Sanitary Drainage Schematic',
            category: 'PLANS',
            fileName: 'Plumbing_Drainage_Schematic.pdf',
            fileSize: '6.8 MB',
            version: 'v1.2',
            uploadedBy: 'Site Engineer (Field Operations)',
            uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80',
            roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
            tags: ['Plumbing Work', 'Plumbing', 'Water Supply', 'Drainage'],
            history: [{ version: 'v1.2', date: '3 days ago', changedBy: 'Site Engineer', note: 'Hydrostatic pressure testing protocol.' }],
          },
          {
            id: `doc-${activeProjId}-7`,
            projectId: activeProjId,
            projectName: projName,
            phaseName: 'Electrical Work',
            title: 'MEP Electrical Single Line Diagram & DB Schedule',
            category: 'PLANS',
            fileName: 'MEP_Electrical_Single_Line_Diagram.pdf',
            fileSize: '8.4 MB',
            version: 'v2.0',
            uploadedBy: 'Site Engineer (Field Operations)',
            uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80',
            roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
            tags: ['Electrical Work', 'MEP', 'Distribution', 'Schematic'],
            history: [{ version: 'v2.0', date: '2 days ago', changedBy: 'Site Engineer', note: 'Sub-circuit balance and earth pit schematics.' }],
          },
          {
            id: `doc-${activeProjId}-8`,
            projectId: activeProjId,
            projectName: projName,
            phaseName: 'Paint & Finishing Work',
            title: 'Exterior & Interior Paint Specification & Surface Prep Schedule',
            category: 'PLANS',
            fileName: 'Paint_Finishing_Specs_Schedule.pdf',
            fileSize: '4.6 MB',
            version: 'v1.1',
            uploadedBy: 'Site Engineer (Field Operations)',
            uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80',
            roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
            tags: ['Paint & Finishing Work', 'Putty', 'Primer', 'Asian Paints Apex Ultima'],
            history: [{ version: 'v1.1', date: 'Yesterday', changedBy: 'Site Engineer', note: 'Approved paint shade codes and two-coat primer schedule.' }],
          },
          {
            id: `doc-${activeProjId}-9`,
            projectId: activeProjId,
            projectName: projName,
            phaseName: 'Interior & Woodwork',
            title: 'Interior Joinery, Millwork & False Ceiling Detail Drawings',
            category: 'PLANS',
            fileName: 'Interior_Joinery_Ceiling_Drawings.pdf',
            fileSize: '11.3 MB',
            version: 'v2.0',
            uploadedBy: 'Site Engineer (Field Operations)',
            uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
            roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
            tags: ['Interior & Woodwork', 'Joinery', 'False Ceiling', 'Gypsum'],
            history: [{ version: 'v2.0', date: 'Yesterday', changedBy: 'Site Engineer', note: 'Teak wood door frames and modular wardrobe structural drawings.' }],
          },
          {
            id: `doc-${activeProjId}-10`,
            projectId: activeProjId,
            projectName: projName,
            phaseName: 'Handover & Commissioning',
            title: 'Final Quality & Structural Fitness Certification',
            category: 'PERMITS',
            fileName: 'Final_Inspection_Certification_NOC.pdf',
            fileSize: '2.8 MB',
            version: 'v1.0',
            uploadedBy: 'Executive Admin',
            uploadedAt: new Date().toISOString(),
            url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
            roleVisibility: ['ADMIN', 'ENGINEER', 'CONTRACTOR', 'CUSTOMER'],
            tags: ['Handover & Commissioning', 'Certificate', 'Fitness NOC', 'Quality Clearance'],
            history: [{ version: 'v1.0', date: 'Today', changedBy: 'Executive Admin', note: 'Quality audit clearance for client handover.' }],
          },
        ];
        documentsStore.push(...phaseSeedDocs);
      }
    }

    let filtered = documentsStore;

    // Strict Client Isolation
    if (auth.isClient) {
      if (targetProjectId) {
        filtered = filtered.filter(doc => doc.projectId === targetProjectId);
      }
      filtered = filtered.filter(doc => doc.roleVisibility.includes('CUSTOMER'));
    } else if (projectId && projectId !== 'all') {
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
      phaseName = 'Planning',
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
      phaseName: phaseName,
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

