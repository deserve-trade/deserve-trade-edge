// app/pages/ui-kit.tsx
import { Card } from "~/components/kit/Card";
import { Button } from "~/components/kit/Button";
import { Segmented } from "~/components/kit/SegmentedControl";
import { MediaCard } from "~/components/kit/MediaCard";
import { GlitchTitle } from "~/components/kit/Typography";

export async function loader() {
  return null
}

export default function UIKitPage() {
  return (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <h3 className="mb-4 opacity-70">Typography</h3>
        <GlitchTitle>deserve</GlitchTitle>
      </Card>

      <Card>
        <h3 className="mb-4 opacity-70">Buttons</h3>
        <div className="flex gap-3 flex-wrap">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="neon">Neon</Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 opacity-70">Segmented</h3>
        <Segmented
          items={["Energy", "Health", "Stamina"]}
          active={2}
        />
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <MediaCard />
        <MediaCard />
        <MediaCard label="deserve" />
        <MediaCard label="card" />
      </div>
    </div>
  );
}
