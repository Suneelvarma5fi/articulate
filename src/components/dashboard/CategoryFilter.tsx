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
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="mb-3 font-handjet text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        Categories
      </p>
      <div className="flex flex-col gap-1">
        <button
          onClick={() => onSelectionChange([])}
          className={`rounded-lg px-3 py-2 text-left text-xs transition-all ${
            allSelected
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
              className={`rounded-lg px-3 py-2 text-left text-xs transition-all ${
                isSelected
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
