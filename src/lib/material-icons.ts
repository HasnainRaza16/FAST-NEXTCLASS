import {
  FileText,
  Presentation,
  FileSpreadsheet,
  Archive,
  Image as ImageIcon,
  FileCode,
  Video,
  File as FileIcon,
} from "lucide-react";
import type { MaterialFileType } from "@/lib/materials-types";

export const FILE_TYPE_ICON: Record<MaterialFileType, typeof FileText> = {
  pdf: FileText,
  doc: FileText,
  slides: Presentation,
  sheet: FileSpreadsheet,
  archive: Archive,
  image: ImageIcon,
  code: FileCode,
  video: Video,
  text: FileText,
  other: FileIcon,
};
