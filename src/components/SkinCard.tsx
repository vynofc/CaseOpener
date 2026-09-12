import { InventoryItem, rarityById } from "@/lib/types";
import SkinImage from "./SkinImage";

export default function SkinCard({
  item,
  size = "md",
  highlight = false,
}: {
  item: InventoryItem;
  size?: "sm" | "md";
  highlight?: boolean;
}) {
  const rarity = rarityById(item.skin.rarity);
  const w = size === "sm" ? "w-28 h-24" : "w-36 h-28";
  return (
    <div
      className={`relative ${w} shrink-0 rounded-lg border bg-[#151a26] overflow-hidden flex flex-col items-center justify-center transition-transform ${
        highlight ? "skin-highlight" : ""
      }`}
      style={{ borderColor: rarity.color + "66" }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: rarity.color }}
      />
      {item.stattrak && (
        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-orange-400 bg-orange-400/10 rounded px-1">
          ST
        </span>
      )}
      <SkinImage skin={item.skin} eager className="w-4/5 h-3/5 object-contain mt-2" />
      <div className="absolute bottom-1 inset-x-1 text-center leading-tight">
        <div className="text-[9px] text-zinc-400 truncate">{item.skin.weapon}</div>
        <div className="text-[10px] font-semibold text-zinc-100 truncate">{item.skin.name}</div>
      </div>
    </div>
  );
}
