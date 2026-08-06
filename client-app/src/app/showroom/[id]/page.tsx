import { redirect } from 'next/navigation';

interface ShowroomCarDetailProps {
    params: Promise<{ id: string }>;
}

export default async function ShowroomCarDetailRedirect({ params }: ShowroomCarDetailProps) {
    const { id } = await params;
    if (id) {
        redirect(`/cars/${id}`);
    }
    redirect('/cars');
}
