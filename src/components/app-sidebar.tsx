"use client";

import { Edit, GlobeIcon, SettingsIcon } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { useTranslation } from "./translation-provider";

export function LanguageSelector() {
    const { selectedLanguage, setSelectedLanguage, normalizedTranslations, loading } = useTranslation();
    const [open, setOpen] = React.useState(false)

    if (loading)
        return <div>Loading...</div>;

    return (
        <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <Button
                variant="ghost"
                role="combobox"
                aria-expanded={open}
                className="py-7 border"
            >
            {selectedLanguage
                ? (
                    <div className="flex flex-row items-center">
                        <GlobeIcon />
                        <div className="flex flex-col ml-3">
                            <span className="text-xs font-medium text-start">
                                {normalizedTranslations[selectedLanguage].NativeName}<br/>
                                <span className="text-xs text-muted-foreground">
                                    {selectedLanguage.match("-") ? `Localized (${selectedLanguage})` : `Language (${selectedLanguage})`}
                                </span>
                            </span>
                        </div>
                    </div>
                )
                : "Select language..."}
            <ChevronsUpDown className="ml-auto opacity-50" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 max-w-[240px]">
            <Command>
            <CommandInput placeholder="Search language..." className="h-9" />
            <CommandList>
                <CommandEmpty>No language found.</CommandEmpty>
                <CommandGroup>
                {Object.keys(normalizedTranslations).map((key) => (
                    <CommandItem
                        key={key}
                        value={key}
                        onSelect={(currentValue) => {
                            setSelectedLanguage(currentValue)
                            setOpen(false)
                        }}
                    >
                    <GlobeIcon className="mr-1 h-4 w-4" />
                        {normalizedTranslations[key].NativeName} ({key})
                        <Check
                            className={cn("ml-auto", selectedLanguage === key ? "opacity-100" : "opacity-0")}
                        />
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
            </Command>
        </PopoverContent>
        </Popover>
    )
}


export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader>
            <LanguageSelector />
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>Utilities</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                        <a href={"/"}>
                            <Edit />
                            <span>Edit Translations</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                        <a href={"/settings"}>
                            <SettingsIcon />
                            <span>Settings</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
