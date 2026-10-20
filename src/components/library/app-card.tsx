"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { FrameCanvas } from "@/components/frame-canvas";
import type { Caption, Design } from "@/lib/design/model";

export type AppCardData = {
  id: string;
  name: string;
  bundleId: string;
  locales: string[];
  frameCount: number;
  design: Design;
  previews: { caption: Caption; fileId?: string }[];
};

const SIZE = { width: 1320, height: 2868 };
const FAN = [
  { rest: { rotate: -7, x: -46, y: 10 }, hover: { rotate: -11, x: -74, y: 4 } },
  { rest: { rotate: 0, x: 0, y: 0 }, hover: { rotate: 0, x: 0, y: -10 } },
  { rest: { rotate: 7, x: 46, y: 10 }, hover: { rotate: 11, x: 74, y: 4 } },
];

export function AppCard({ app }: { app: AppCardData }) {
  const previews = app.previews.length > 0 ? app.previews : [{ caption: { badge: "", title: "", subtitle: "" } }];
  const order = previews.length === 1 ? [1] : previews.length === 2 ? [0, 2] : [0, 1, 2];

  return (
    <motion.li initial="rest" whileHover="hover" animate="rest" className="list-none">
      <Link
        href={`/apps/${app.id}`}
        className="group block overflow-hidden rounded-2xl border border-line bg-panel shadow-soft transition hover:shadow-float"
      >
        <div className="relative m-2 flex h-60 items-end justify-center overflow-hidden rounded-xl bg-gradient-to-b from-raised to-[#eceef2]">
          {previews.slice(0, 3).map((preview, index) => {
            const fan = FAN[order[index]];
            return (
              <motion.div
                key={index}
                variants={fan}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="absolute bottom-[-46px] w-[112px] origin-bottom overflow-hidden rounded-[8px] shadow-[0_12px_28px_-10px_rgba(16,24,40,0.35)]"
                style={{ zIndex: order[index] === 1 ? 3 : 1 }}
              >
                <FrameCanvas design={app.design} caption={preview.caption} fileId={preview.fileId} size={SIZE} />
              </motion.div>
            );
          })}
        </div>
        <div className="flex items-start justify-between gap-3 px-4 pb-4 pt-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{app.name}</p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-ink-3">{app.bundleId}</p>
            <p className="mt-3 flex flex-wrap gap-1">
              {app.locales.map((code) => (
                <span key={code} className="rounded-md bg-raised px-1.5 py-0.5 font-mono text-[10px] text-ink-2">
                  {code}
                </span>
              ))}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-3">
            <span className="grid size-7 place-items-center rounded-full bg-raised text-ink-3 transition group-hover:bg-accent group-hover:text-white"><ArrowUpRight className="size-3.5" /></span>
            <span className="text-xs text-ink-3">
              {app.frameCount} {app.frameCount === 1 ? "frame" : "frames"}
            </span>
          </div>
        </div>
      </Link>
    </motion.li>
  );
}
