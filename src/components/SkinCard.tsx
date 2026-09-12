import { InventoryItem, rarityById } from "@/lib/types";
import SkinImage from "./SkinImage";

export default function SkinCard({
  item,
  size = "md",
  highlight = false,
  mystery = false,
}: {
  item: InventoryItem;
  size?: "sm" | "md";
  highlight?: boolean;
  mystery?: boolean;
}) {
  const rarity = rarityById(item.skin.rarity);
  const w = size === "sm" ? "w-28 h-24" : "w-36 h-28";
  return (
    <div
      className={`relative ${w} shrink-0 rounded-sm border bg-cs-900/90 overflow-hidden flex flex-col items-center justify-center transition-transform ${
        highlight ? "skin-highlight" : ""
      }`}
      style={{ borderColor: rarity.color + "66" }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: rarity.color }}
      />
      {item.stattrak && !mystery && (
        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold text-orange-400 bg-orange-400/10 rounded-sm px-1">
          ST
        </span>
      )}
      {mystery ? (
        <>
          <div className="item-plate absolute inset-x-2 top-4 bottom-7 rounded-sm" />
          <div className="relative flex-1 flex items-center justify-center text-4xl leading-none" style={{ color: rarity.color }}>
            ★
          </div>
          <div className="absolute bottom-1 inset-x-1 text-center leading-tight">
            <div className="text-[9px] text-zinc-400 truncate">???</div>
            <div className="text-[10px] font-semibold truncate" style={{ color: rarity.color }}>
              Spezial-Item
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="item-plate absolute inset-x-2 top-4 bottom-7 rounded-sm" />
          <SkinImage skin={item.skin} eager className="relative w-4/5 h-3/5 object-contain mt-2" />
          <div className="absolute bottom-1 inset-x-1 text-center leading-tight">
            <div className="text-[9px] text-zinc-400 truncate">{item.skin.weapon}</div>
            <div className="text-[10px] font-semibold text-zinc-100 truncate">{item.skin.name}</div>
          </div>
        </>
      )}
    </div>
  );
}
