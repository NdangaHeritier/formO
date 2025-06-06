import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Your email logic
  console.log(req.body);
  return(
    NextResponse.json({ success: true })
  );
}