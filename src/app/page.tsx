import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold">Exciting work is being done...</h1>
      <p className="text-muted-foreground">
        Welcome to Moneo. This app will show you where your money goes, and why.
        Visit the GitHub project to see more details.
      </p>
      <a
        className={buttonVariants()}
        href="https://github.com/evolveris/moneo"
        target="_blank"
        rel="noopener noreferrer"
      >
        View project on GitHub
      </a>
    </div>
  );
}
