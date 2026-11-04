type Props = {
  title: string;
  description: string;
};

export function ProfessionalCategoryCard({ title, description }: Props) {
  return (
    <article className="card h-full min-w-0">
      <h3 className="break-words text-xl font-medium tracking-[-0.03em]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
        {description}
      </p>
    </article>
  );
}
