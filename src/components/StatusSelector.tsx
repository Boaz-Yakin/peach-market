"use client";

import { useState } from "react";
import { createClient } from "../lib/supabaseBrowser";
import { useRouter } from "next/navigation";

type ItemStatus = "selling" | "reserved" | "sold";

interface StatusSelectorProps {
  itemId: string;
  initialStatus: ItemStatus;
}

export default function StatusSelector({ itemId, initialStatus }: StatusSelectorProps) {
  const [status, setStatus] = useState<ItemStatus>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleStatusChange = async (newStatus: ItemStatus) => {
    if (newStatus === status) return;
    
    setIsUpdating(true);
    const { error } = await supabase
      .from("items")
      .update({ status: newStatus })
      .eq("id", itemId);

    if (error) {
      alert("상태 변경 실패: " + error.message);
    } else {
      setStatus(newStatus);
      router.refresh();
    }
    setIsUpdating(false);
  };

  const statusMap = {
    selling: { label: "판매중", color: "text-gray-700 bg-gray-100" },
    reserved: { label: "예약중", color: "text-blue-600 bg-blue-50" },
    sold: { label: "판매완료", color: "text-gray-400 bg-gray-100" },
  };

  return (
    <div className="flex gap-2 mb-4">
      {(Object.keys(statusMap) as ItemStatus[]).map((s) => (
        <button
          key={s}
          disabled={isUpdating}
          onClick={() => handleStatusChange(s)}
          className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
            status === s
              ? "bg-gray-800 text-white shadow-md ring-2 ring-gray-800 ring-offset-2"
              : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"
          } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {statusMap[s].label}
          {status === s && isUpdating && "..."}
        </button>
      ))}
    </div>
  );
}
