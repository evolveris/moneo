import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">Nothing here yet</h1>
      <p className="text-muted-foreground">
        Moneo shows where your money goes, and why.
      </p>
      <Button disabled>Load demo data</Button>
    </div>
  );
}
