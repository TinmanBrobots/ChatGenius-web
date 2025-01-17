"use client"

import { useState, useEffect, useCallback } from "react"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  description?: string
}

interface ComboboxMultiProps {
  value: string[]
  onChange: (value: string[]) => void
  onSearch: (query: string) => Promise<ComboboxOption[]>
  placeholder?: string
  emptyText?: string
  loadingText?: string
  maxSelected?: number
  startOpen?: boolean
  excludeValues?: string[]
  side?: "top" | "bottom" | "left" | "right"
  initSelectedValues?: Record<string, string>
}

export function ComboboxMulti({
  value,
  onChange,
  onSearch,
  placeholder = "Select items...",
  emptyText = "No items found.",
  loadingText = "Loading...",
  maxSelected,
  startOpen = false,
  excludeValues = [],
  side = "bottom",
  initSelectedValues = {},
}: ComboboxMultiProps) {
  const [open, setOpen] = useState(startOpen)
  const [query, setQuery] = useState("")
  const [options, setOptions] = useState<ComboboxOption[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>(initSelectedValues)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query) {
        setLoading(true)
        try {
          const results = await onSearch(query)
          const filteredResults = results.filter(option => !excludeValues.includes(option.value))
          setOptions(filteredResults)
          // Update selected labels with any new options
          const newLabels = { ...selectedLabels }
          filteredResults.forEach(option => {
            if (value.includes(option.value)) {
              newLabels[option.value] = option.label
            }
          })
          setSelectedLabels(newLabels)
        } catch (error) {
          console.error('Search failed:', error)
          setOptions([])
        } finally {
          setLoading(false)
        }
      } else {
        setOptions([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, onSearch])

  const handleSelect = useCallback((optionValue: string, optionLabel: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue))
      const newLabels = { ...selectedLabels }
      delete newLabels[optionValue]
      setSelectedLabels(newLabels)
    } else if (!maxSelected || value.length < maxSelected) {
      onChange([...value, optionValue])
      setSelectedLabels(prev => ({
        ...prev,
        [optionValue]: optionLabel
      }))
    }
  }, [value, onChange, maxSelected, selectedLabels])

  const removeValue = useCallback((optionValue: string) => {
    onChange(value.filter(v => v !== optionValue))
    const newLabels = { ...selectedLabels }
    delete newLabels[optionValue]
    setSelectedLabels(newLabels)
  }, [value, onChange, selectedLabels])

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            onClick={() => setOpen(true)}
          >
            {value.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : maxSelected === 1 ? (
              <span className="truncate">
                {selectedLabels[value[0]]}
              </span>
            ) : (
              <span className="truncate">
                {value.length} selected
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start" side={side}>
          <Command shouldFilter={false}>
            <CommandInput 
              className="combobox-input"
              placeholder="Search..." 
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center gap-2 p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{loadingText}</span>
                </div>
              ) : options.length === 0 && query ? (
                <CommandEmpty>{emptyText}</CommandEmpty>
              ) : (
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      className="combobox-option"
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value, option.label)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(option.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        {option.description && (
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {maxSelected !== 1 && value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((v) => (
            <Badge key={v} variant="outline">
              {selectedLabels[v]}
              <button
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    removeValue(v)
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={() => removeValue(v)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
} 