import { InventoryItem, rarityById } from "@/lib/types";
import SkinImage from "./SkinImage";

export default function SkinCard({
  item,
  highlight = false,
  mystery = false,
  dimmed = false,
}: {
  item: InventoryItem;
  highlight?: boolean;
  mystery?: boolean;
  dimmed?: boolean;
}) {
  const rarity = rarityById(item.skin.rarity);
  return (
    <div
      className={`relative h-[200px] w-[160px] shrink-0 overflow-hidden rounded-[4px] transition-all duration-500 ${
        highlight ? "z-10 scale-[1.08]" : ""
      }`}
      style={{
        background: `linear-gradient(180deg, ${rarity.color}33 0%, #171a21 45%, #0f1116 100%)`,
        boxShadow: highlight
          ? `0 0 46px 4px ${rarity.color}a6, inset 0 0 0 1px ${rarity.color}`
          : "inset 0 0 0 1px rgba(255,255,255,0.07)",
        opacity: dimmed ? 0.35 : 1,
      }}
    >
      {item.stattrak && !mystery && (
        <span className="absolute top-2 left-2 text-[9px] font-bold text-orange-400/90">
          ST™
        </span>
      )}
      {mystery ? (
        <div className="flex h-full items-center justify-center text-5xl leading-none" style={{ color: rarity.color }}>
          ★
        </div>
      ) : (
        <SkinImage
          skin={item.skin}
          eager
          className="absolute inset-0 m-auto h-[120px] w-[136px] object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.65)]"
        />
      )}
      <div
        className="absolute inset-x-0 bottom-0 h-[5px]"
        style={{ background: rarity.color, boxShadow: `0 0 14px 1px ${rarity.color}` }}
      />
    </div>
  );
}
