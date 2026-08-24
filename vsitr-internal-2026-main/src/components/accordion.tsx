import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

interface AccordionContextType {
  activeValue: string | null;
  setActiveValue: (value: string | null) => void;
  collapsible?: boolean;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  defaultValue?: string;
  collapsible?: boolean;
  children: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({
  type = 'single',
  defaultValue = null,
  collapsible = true,
  className,
  children,
  ...props
}) => {
  const [activeValue, setActiveValue] = useState<string | null>(defaultValue);

  return (
    <AccordionContext.Provider value={{ activeValue, setActiveValue, collapsible }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

const AccordionItemContext = createContext<string | null>(null);

export const AccordionItem: React.FC<AccordionItemProps> = ({
  value,
  className,
  children,
  ...props
}) => {
  const context = useContext(AccordionContext);
  const isOpen = context ? context.activeValue === value : false;

  return (
    <AccordionItemContext.Provider value={value}>
      <div
        data-state={isOpen ? 'open' : 'closed'}
        className={cn('border-b border-slate-200', className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  className,
  children,
  ...props
}) => {
  const context = useContext(AccordionContext);
  const value = useContext(AccordionItemContext);

  if (!context || value === null) {
    return <button className={className} {...props}>{children}</button>;
  }

  const isOpen = context.activeValue === value;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isOpen) {
      if (context.collapsible) {
        context.setActiveValue(null);
      }
    } else {
      context.setActiveValue(value);
    }
    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <button
      type="button"
      data-state={isOpen ? 'open' : 'closed'}
      className={cn(
        'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:no-underline [&[data-state=open]>svg]:rotate-180',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
};

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const AccordionContent: React.FC<AccordionContentProps> = ({
  className,
  children,
  ...props
}) => {
  const context = useContext(AccordionContext);
  const value = useContext(AccordionItemContext);

  if (!context || value === null) {
    return <div className={className} {...props}>{children}</div>;
  }

  const isOpen = context.activeValue === value;

  return (
    <div
      data-state={isOpen ? 'open' : 'closed'}
      className="grid transition-all duration-300 ease-in-out text-sm"
      style={{
        gridTemplateRows: isOpen ? '1fr' : '0fr',
      }}
      {...props}
    >
      <div className="overflow-hidden">
        <div className={cn('pb-4 pt-0', className)}>
          {children}
        </div>
      </div>
    </div>
  );
};
