import { ComposerPageWrapper } from "./ComposerPage";

/**
 * /composer page — uses dynamic imports for code splitting
 * The actual composer logic is in ComposerPageContent.tsx and is
 * loaded dynamically only when the user navigates to this route.
 */
export default function ComposerPageEntry() {
  return <ComposerPageWrapper />;
}
