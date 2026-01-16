"use client";

export default function ProductOptions({
  options,
  selected,
  onChange,
}) {
        console.log(options,selected)
  return (
    <div className="space-y-4">
      {options.map((opt) => (
        <div key={opt.name}>
          <p className="text-sm font-medium mb-1">{opt.name}</p>
          <div className="flex gap-2 flex-wrap">
            {opt.values.map((val) => {
              const active = selected[opt.name] === val;

              return (
                <button
                  key={val}
                  type="button"
                  onClick={() =>
                    onChange({ ...selected, [opt.name]: val })
                  }
                  className={`border px-3 py-1 text-sm ${
                    active
                      ? "bg-black text-white"
                      : "bg-white"
                  }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
