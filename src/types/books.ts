export interface BuiltInBookSummary {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  metaPath: string;
  defaultVolumeId: string;
  volumeCount: number;
  tags: string[];
}

export interface BuiltInVolume {
  id: string;
  label: string;
  title: string;
  textPath: string;
}

export interface BuiltInBookMeta {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  illustrator: string;
  description: string;
  defaultVolumeId: string;
  volumes: BuiltInVolume[];
}

export function buildBuiltInBookProgressKey(slug: string, volumeId: string) {
  return `${slug}::${volumeId}`;
}
