export default function HabitSelector({ habits, selected, onSelect }) {
  return (
    <div className="mb-6">
      <select
        className="w-full p-2 rounded-lg bg-gray-800 text-white border border-gray-700"
        value={selected?._id || ''}
        onChange={(e) => {
          const habit = habits.find(h => h._id === e.target.value);
          onSelect(habit);
        }}
      >
        {habits.map(habit => (
          <option key={habit._id} value={habit._id}>
            {habit.name}
          </option>
        ))}
      </select>
    </div>
  );
}
