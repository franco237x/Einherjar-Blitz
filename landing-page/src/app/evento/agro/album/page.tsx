import { redirect } from 'next/navigation';

// The event is over; the herbarium now lives in the achievements page.
export default function AgroAlbumPage() {
  redirect('/evento/agro');
}
