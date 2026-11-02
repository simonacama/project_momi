import { Suspense } from "react";
import { connection } from "next/server";
import { DesktopCalendar, type View } from "@/components/desktop-calendar";
import { parseISO } from "@/lib/dates";

async function Today({ searchParams }: Pick<PageProps<"/desktop">, "searchParams">) {
  const { v, d } = await searchParams;
  await connection();
  const now = new Date();
  // vista: ?v=month|week|year, data di riferimento: ?d=AAAA-MM-GG (default: mese corrente, oggi)
  const view: View = v === "week" || v === "year" ? v : "month";
  const anchor = parseISO(d) ?? new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return <DesktopCalendar now={now} view={view} anchor={anchor} />;
}

export default function DesktopPage(props: PageProps<"/desktop">) {
  return (
    <Suspense fallback={<div className="h-screen" />}>
      <Today searchParams={props.searchParams} />
    </Suspense>
  );
}
