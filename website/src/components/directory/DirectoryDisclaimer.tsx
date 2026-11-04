import { directoryCopy } from "@/content/directory";

type Props = {
  id?: string;
};

export function DirectoryDisclaimer({ id = "directory-demo-notice" }: Props) {
  return (
    <aside id={id} className="card border-sage/40" role="note">
      <p className="eyebrow">Demonstration only</p>
      <p className="mt-3 text-sm leading-relaxed text-foreground md:text-base">
        {directoryCopy.demoNotice}
      </p>
    </aside>
  );
}
