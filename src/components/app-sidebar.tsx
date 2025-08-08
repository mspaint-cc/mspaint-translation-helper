"use client";

import { Edit, GlobeIcon, PlusIcon, SettingsIcon } from "lucide-react";

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
} from "@/components/ui/sidebar";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "./translation-provider";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
// Publishing is handled from Export/Publish menu; no direct publish here
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSelector() {
  const {
    selectedLanguage,
    setSelectedLanguage,
    normalizedTranslations,
    loading,
  } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [addMode, setAddMode] = React.useState<"language" | "locale">(
    "language"
  );
  const [code, setCode] = React.useState("");
  const [englishName, setEnglishName] = React.useState("");
  const [nativeName, setNativeName] = React.useState("");
  const [localLanguages, setLocalLanguages] = React.useState<
    Record<string, { EnglishName: string; NativeName: string }>
  >({});

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("localLanguages");
      if (raw) setLocalLanguages(JSON.parse(raw));
    } catch {}
  }, []);

  const mergedLanguages: Record<
    string,
    { EnglishName: string; NativeName: string }
  > = React.useMemo(() => {
    const normalized = normalizedTranslations as unknown as Record<
      string,
      { EnglishName: string; NativeName: string }
    >;
    return { ...normalized, ...localLanguages };
  }, [normalizedTranslations, localLanguages]);

  const baseCode = React.useMemo(
    () => selectedLanguage.split("-")[0],
    [selectedLanguage]
  );
  const isLanguageCodeValid = (value: string) => /^[a-z0-9]{2,3}$/.test(value);
  const isSubLocaleValid = (value: string) => /^[a-z0-9]{2,3}$/.test(value);
  const effectiveCode = React.useMemo(() => {
    const trimmed = code.trim().toLowerCase();
    return addMode === "locale" ? `${baseCode}-${trimmed}` : trimmed;
  }, [code, addMode, baseCode]);
  const codeExists = React.useMemo(
    () => Boolean(mergedLanguages[effectiveCode]),
    [mergedLanguages, effectiveCode]
  );
  const isValid = React.useMemo(
    () =>
      addMode === "locale"
        ? isSubLocaleValid(code.trim())
        : isLanguageCodeValid(code.trim()),
    [addMode, code]
  );
  const canSubmit = Boolean(
    isValid && englishName.trim() && nativeName.trim() && !codeExists
  );

  const saveLocal = () => {
    if (codeExists) {
      toast.error("That code already exists.");
      return;
    }
    const key = effectiveCode;
    const data = {
      EnglishName: englishName.trim(),
      NativeName: nativeName.trim(),
    };
    const next = { ...localLanguages, [key]: data };
    setLocalLanguages(next);
    localStorage.setItem("localLanguages", JSON.stringify(next));
    setSelectedLanguage(key);
    setAddOpen(false);
    setCode("");
    setEnglishName("");
    setNativeName("");
    toast.success("Saved locally");
  };

  // removed publishNow; publication handled in Export/Publish menu

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="py-7 border"
          >
            {selectedLanguage ? (
              <div className="flex flex-row items-center">
                <GlobeIcon />
                <div className="flex flex-col ml-3">
                  <span className="text-xs font-medium text-start">
                    {mergedLanguages[selectedLanguage]?.NativeName ||
                      selectedLanguage}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {selectedLanguage.match("-")
                        ? `Localized (${selectedLanguage})`
                        : `Language (${selectedLanguage})`}
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              "Select language..."
            )}
            <ChevronsUpDown className="ml-auto opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 max-w-[240px]">
          <Command>
            <CommandInput placeholder="Search language..." className="h-9" />
            <CommandList>
              <CommandEmpty>No language found.</CommandEmpty>
              <CommandGroup>
                {Object.keys(mergedLanguages).map((key) => (
                  <CommandItem
                    key={key}
                    value={key}
                    onSelect={(currentValue) => {
                      setSelectedLanguage(currentValue);
                      setOpen(false);
                    }}
                  >
                    <GlobeIcon className="mr-1 h-4 w-4" />
                    {mergedLanguages[key].NativeName} ({key})
                    <Check
                      className={cn(
                        "ml-auto",
                        selectedLanguage === key ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="mt-2">
        <AlertDialog open={addOpen} onOpenChange={setAddOpen}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 py-2 border"
              >
                <PlusIcon className="h-4 w-4" /> Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Create</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setAddMode("language");
                  setAddOpen(true);
                }}
              >
                New language
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setAddMode("locale");
                  setAddOpen(true);
                }}
              >
                New locale
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {addMode === "language" ? "Add Language" : "Add Locale"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {addMode === "language"
                  ? 'Add a new base language (e.g., "fr"). It will be saved locally; you can publish from the Export/Publish menu when ready.'
                  : 'Add a new locale (e.g., "zh-cn"). It will be saved locally; you can publish from the Export/Publish menu when ready.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">
                  Language code
                </span>
                {addMode === "locale" ? (
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-2 rounded-md border bg-muted text-muted-foreground text-sm select-none">
                      {baseCode}-
                    </div>
                    <Input
                      placeholder="e.g., cn"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
                ) : (
                  <Input
                    placeholder="e.g., fr"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                )}
                {code && (!isValid || codeExists) && (
                  <span className="text-xs text-red-500">
                    {!isValid
                      ? addMode === "locale"
                        ? "Invalid sub-locale format. Use bb."
                        : "Invalid language code. Use aa or aaa."
                      : "That code already exists."}
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <span className="text-sm text-muted-foreground">
                    English name
                  </span>
                  <Input
                    placeholder="e.g., French"
                    value={englishName}
                    onChange={(e) => setEnglishName(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <span className="text-sm text-muted-foreground">
                    Native name
                  </span>
                  <Input
                    placeholder="e.g., Français"
                    value={nativeName}
                    onChange={(e) => setNativeName(e.target.value)}
                  />
                </div>
              </div>
              <div className="rounded-md bg-muted/40 border p-3 text-xs text-muted-foreground">
                {addMode === "locale" ? (
                  <>
                    This will create a local entry for{" "}
                    <span className="font-semibold">{effectiveCode}</span>. You
                    can publish it later from Export/Publish.
                  </>
                ) : (
                  <>
                    This will create a local entry for{" "}
                    <span className="font-semibold">
                      {effectiveCode || "<code>"}
                    </span>
                    . You can publish it later from Export/Publish.
                  </>
                )}
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <Button
                disabled={!canSubmit}
                variant="secondary"
                onClick={saveLocal}
              >
                Save locally
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader>
          <p className="py-2 text-center">mspaint translation helper</p>
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
  );
}
