import { StylistPageWrapper } from "./StylistPage";

/**
 * /stylist page — uses dynamic imports for code splitting
 * The actual stylist logic is in StylistPageContent.tsx and is
 * loaded dynamically only when the user navigates to this route.
 */
export default function StylistPageEntry() {
  return <StylistPageWrapper />;
}
