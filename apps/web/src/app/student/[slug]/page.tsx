type Props = { params: { slug: string } };

export default function StudentPage({ params }: Props) {
  return <div>Student page for: {params.slug}</div>;
}
