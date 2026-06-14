import { motion } from "framer-motion";

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 h-4 w-3/4 rounded-full bg-secondary" />
      <div className="mb-2 h-3 w-1/2 rounded-full bg-secondary" />
      <div className="h-3 w-2/3 rounded-full bg-secondary" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-8">
      <div className="animate-pulse rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-secondary" />
          <div className="flex-1">
            <div className="mb-2 h-5 w-1/3 rounded-full bg-secondary" />
            <div className="mb-1 h-3 w-1/4 rounded-full bg-secondary" />
            <div className="h-3 w-1/5 rounded-full bg-secondary" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded-full bg-secondary" />
          <div className="h-3 w-4/5 rounded-full bg-secondary" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
          <div className="mb-2 h-4 w-1/2 rounded-full bg-secondary" />
          <div className="h-3 w-2/3 rounded-full bg-secondary" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto max-w-2xl px-5 pt-8"
    >
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-1/4 rounded-full bg-secondary" />
        <div className="h-8 w-2/3 rounded-full bg-secondary" />
        <div className="h-4 w-1/2 rounded-full bg-secondary" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </motion.div>
  );
}
