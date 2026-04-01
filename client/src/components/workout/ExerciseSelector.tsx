import { useState } from "react";
import type { Exercise } from "../../types/exercise";

interface Props {
  exercises: Exercise[];
  value: string;
  onChange: (value: string) => void;
}

function ExerciseSelector({ exercises, value, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // ✅ derive selected exercise name
  const selectedExercise = exercises.find((ex) => ex._id === value);

  const displayValue = showDropdown
    ? search
    : selectedExercise?.name || search;

  const filtered = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search exercise..."
        value={displayValue}
        onFocus={() => setShowDropdown(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange(""); // reset selected
        }}
        className="w-full p-3 rounded-lg bg-black/60 border border-gray-700 text-white focus:ring-2 focus:ring-purple-500"
      />

      {showDropdown && (
        <div className="absolute w-full bg-gray-900 border border-gray-700 mt-2 rounded-lg max-h-60 overflow-y-auto z-10">

          {/* Results */}
          {filtered.length > 0 ? (
            filtered.map((ex) => (
              <div
                key={ex._id}
                onClick={() => {
                  onChange(ex._id);
                  setSearch("");
                  setShowDropdown(false);
                }}
                className="p-3 hover:bg-gray-800 cursor-pointer"
              >
                {ex.name}
              </div>
            ))
          ) : (
            <div className="p-3 text-gray-400">
              No results found
            </div>
          )}

          {/* Add Custom */}
          {search &&
            !filtered.some(
              (ex) => ex.name.toLowerCase() === search.toLowerCase()
            ) && (
              <div
                className="p-3 text-blue-400 cursor-pointer hover:bg-gray-800"
                onClick={() => {
                  onChange(search);
                  setShowDropdown(false);
                }}
              >
                ➕ Add "{search}" as custom exercise
              </div>
            )}
        </div>
      )}
    </div>
  );
}

export default ExerciseSelector;