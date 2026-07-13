import { NextResponse } from "next/server";

import { getOpenPersonalTrainingChargesDashboardData } from "@/lib/personal-training-open-items";

export async function GET() {
  const data = await getOpenPersonalTrainingChargesDashboardData();

  return NextResponse.json(data);
}