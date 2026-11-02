import { Suspense } from "react";
import { connection } from "next/server";
import { Calendar } from "@/components/calendar";
import { toISO } from "@/lib/dates";

async function Today() {
  await connection();
  return <Calendar today={toISO(new Date())} />;
}

export default function Home() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <Today />
    </Suspense>
  );
}
