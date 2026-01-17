import { InputHTMLAttributes } from 'react';
import { Search } from 'lucide-react';
import { inputStyles } from '../../utils/styles';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  placeholder?: string;
}

export default function SearchInput({ className = '', ...props }: SearchInputProps) {
  const combinedClassName = `${inputStyles} pl-10 ${className}`.trim();

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-muted" />
      <input
        type="text"
        className={combinedClassName}
        {...props}
      />
    </div>
  );
}
