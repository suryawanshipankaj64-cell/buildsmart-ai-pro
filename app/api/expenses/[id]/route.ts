import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('DELETE_EXPENSE_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete expense' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data: Record<string, any> = {};

    if (body.category) data.category = String(body.category).toUpperCase();
    if (body.itemName) data.itemName = String(body.itemName).trim();
    if (body.amount !== undefined) data.amount = Number(body.amount);
    if (body.date) data.date = new Date(body.date);
    if (body.receiptUrl !== undefined) data.receiptUrl = body.receiptUrl;

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('PATCH_EXPENSE_ERROR:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update expense' },
      { status: 500 }
    );
  }
}

