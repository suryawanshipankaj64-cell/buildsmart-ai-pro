import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expenses = await prisma.expense.findMany({
      where: { projectId: params.id },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(expenses);
  } catch (error: any) {
    console.error('GET_PROJECT_EXPENSES_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch project expenses' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { category, itemName, amount, date, receiptUrl } = body;

    if (!category || !itemName?.trim() || amount === undefined || amount === null || !date) {
      return NextResponse.json(
        { error: 'Category, item name, amount, and date are required.' },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json({ error: 'Valid amount is required.' }, { status: 400 });
    }

    let parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date();
    }

    const expense = await prisma.expense.create({
      data: {
        projectId: params.id,
        category: String(category).toUpperCase(),
        itemName: String(itemName).trim(),
        amount: parsedAmount,
        date: parsedDate,
        receiptUrl: receiptUrl || null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error('CREATE_PROJECT_EXPENSE_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to record expense' },
      { status: 500 }
    );
  }
}
