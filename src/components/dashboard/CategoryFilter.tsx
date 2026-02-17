"use client";

interface CategoryFilterProps {
  categories: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
}

export function CategoryFilter({
  categories,
  selected,
  onSelectionChange,
}: CategoryFilterProps) {
  const allSelected = selected.length === 0;

  const toggleCategory = (category: string) => {
    if (selected.includes(category)) {
      onSelectionChange(selected.filter((c) => c !== category));
    } else {
      onSelectionChange([...selected, category]);
    }
  };

  return (
    <div className="rounded-xl border border-[#2a2a2a]/10 bg-[#E0E0D5] p-4">
      <p className="mb-3 text-[11px] tracking-[0.15em] text-[#2a2a2a]/50">
        CATEGORIES
      </p>
      <div className="flex flex-col gap-1">
        <button
          onClick={() => onSelectionChange([])}
          className={`rounded-lg px-3 py-2 text-left text-xs tracking-wide transition-all ${
            allSelected
              ? "bg-[#2a2a2a]/10 text-[#2a2a2a]"
              : "text-[#2a2a2a]/50 hover:bg-[#2a2a2a]/5 hover:text-[#2a2a2a]"
          }`}
        >
          All
        </button>

        {categories.map((category) => {
          const isSelected = selected.includes(category);
          return (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`rounded-lg px-3 py-2 text-left text-xs tracking-wide transition-all ${
                isSelected
                  ? "bg-[#2a2a2a]/10 text-[#2a2a2a]"
                  : "text-[#2a2a2a]/50 hover:bg-[#2a2a2a]/5 hover:text-[#2a2a2a]"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
