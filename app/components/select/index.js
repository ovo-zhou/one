import React, { useState } from "react";

const Select = ({ options, onChange, initialValue }) => {
  const [selectedValue, setSelectedValue] = useState(initialValue || "");

  const handleChange = (e) => {
    const newValue = e.target.value;
    setSelectedValue(newValue);
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <select
      className="block appearance-none bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
      value={selectedValue}
      onChange={handleChange}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
