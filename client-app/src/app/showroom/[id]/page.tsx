import { redirect } from 'next/navigation';

interface ShowroomCarDetailProps {
    params: { id: string };
}

export default function ShowroomCarDetailRedirect({ params }: ShowroomCarDetailProps) {
    const { id } = params;
    if (id) {
        redirect(`/cars/${id}`);
    }
    redirect('/cars');
}
