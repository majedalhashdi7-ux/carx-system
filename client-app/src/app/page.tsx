import HomeClient, { type CarType } from "./home-client";

export default function Page() {
  // SSR was causing a slow TTFB or hanging the Suspense boundary.
  // Passing an empty array so the client fetches data asynchronously and instantly paints the layout.
  return <HomeClient latestCars={[]} />;
}
