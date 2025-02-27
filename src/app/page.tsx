"use client";

import { useTranslation } from "@/components/translation-provider";
import { Input } from "@/components/ui/input";
import { ArrowRight, BugIcon, DownloadIcon, FileJsonIcon, GithubIcon, HammerIcon, Languages, MinusCircle, RefreshCcwIcon, Scroll, Search, SendIcon, X } from "lucide-react";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Editor from "@monaco-editor/react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { get_key } from "@/server/datahandler";
import { publish_translations } from "@/server/githubhandler";
import { useSession } from "next-auth/react"


export default function Home() {
  const { 
    loading, 
    selectedLanguage, 
    normalizedTranslations, 
    currentLanguageData, 
    currentLanguageDataLoading, 
    latestTranslation 
  } = useTranslation();

  const { data: session } = useSession()
  
  const [key, setKey] = React.useState("");

  const [clearTranslationsOpen, setClearTranslationsOpen] = React.useState(false);
  const [clearTranslationTimeout, setClearTranslationTimeout] = React.useState<number>(5);

  const [importLanguageOpen, setImportLanguageOpen] = React.useState(false);
  const [importedLanguageRaw, setImportedLanguageRaw] = React.useState("");
  const [importedLanguageDataValid, setImportedLanguageDataValid] = React.useState(false);
  const [importedLanguageDataError, setImportedLanguageDataError] = React.useState("");

  const [publishOpen, setPublishOpen] = React.useState(false);

  const [missingTranslations, setMissingTranslations] = React.useState<Record<string, string>>({});
  const [processing, setProcessing] = React.useState<boolean>(true);
  
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = React.useState<number>(10);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [activeTab, setActiveTab] = React.useState<string>("missing");

  const [lastModifiedTranslations, setLastModifiedTranslations] = React.useState<Record<string, string>>({});
  const [modifiedTranslations, setModifiedTranslations] = React.useState<Record<string, string>>({});
  
  React.useEffect(() => {
    if (!importLanguageOpen) return;
    setImportedLanguageRaw(JSON.stringify(missingTranslations, null, 2));
  }, [importLanguageOpen]);

  React.useEffect(() => {
    if (!clearTranslationsOpen) return;

    setClearTranslationTimeout(5);
    const interval = setInterval(() => {
      setClearTranslationTimeout((timeout) => {
        if (timeout === 1) {
          clearInterval(interval);
        }
        return timeout - 1;
      });
    }, 1000);
  }, [clearTranslationsOpen]);

  React.useEffect(() => {    
    try {
      JSON.parse(importedLanguageRaw);
      setImportedLanguageDataValid(true);
      setImportedLanguageDataError("");
    } catch (error) {
      setImportedLanguageDataValid(false);
      setImportedLanguageDataError((error as Error).message.replace("JSON.parse: ", ""));
    }
  }, [importedLanguageRaw]);

  React.useEffect(() => {
    try {
      const savedData = localStorage.getItem(`modifiedTranslations-${selectedLanguage}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setModifiedTranslations(parsed);
        setLastModifiedTranslations(parsed);
      } else {
        setModifiedTranslations({});
        setLastModifiedTranslations({});
      }
    } catch (error) {
      console.error('Error loading saved translations:', error);
      setModifiedTranslations({});
      setLastModifiedTranslations({});
    }
  }, [selectedLanguage]);
  
  React.useEffect(() => {
    const fetchData = async () => {
      const key = await get_key();
      if (!key) {
        toast.info("Key not found, we recommend you set a key for testing purposes in the settings tab.");
        return;
      };
      setKey(key);
    };
    fetchData();
  }, []);

  React.useEffect(() => {
    const isDifferent = Object.keys(modifiedTranslations).length !== Object.keys(lastModifiedTranslations).length || Object.keys(modifiedTranslations).some(key => modifiedTranslations[key] !== lastModifiedTranslations[key]);

    if (isDifferent) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(
          `modifiedTranslations-${selectedLanguage}`, 
          JSON.stringify(modifiedTranslations)
        );
        setLastModifiedTranslations(modifiedTranslations);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [modifiedTranslations, lastModifiedTranslations, selectedLanguage]);

  const handleModifiedTranslationChange = React.useCallback((key: string, value: string) => {
    setModifiedTranslations(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  React.useEffect(() => {
    setProcessing(true);
    if (currentLanguageData === undefined) return;
    
    const missingTranslations: Record<string, string> = {};
    for (const key in latestTranslation) {
      if (currentLanguageData[key] === undefined || currentLanguageData[key].trim() === "" && selectedLanguage !== "en") {
        missingTranslations[key] = latestTranslation[key];
      }
    }
    setMissingTranslations(missingTranslations);
    setProcessing(false);
  }, [currentLanguageData, latestTranslation]);

  const getActiveTranslations = () => {
    if (activeTab === "missing") {
      return Object.entries(missingTranslations);
    } else {
      const translations =
        selectedLanguage === "en"
          ? latestTranslation
          : currentLanguageData || {};
      return Object.entries(translations);
    }
  };

  const filteredTranslations = getActiveTranslations().filter(
    ([key, value]) =>
      key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTranslations = filteredTranslations.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(filteredTranslations.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
    setSearchTerm("");
  };

  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        endPage = Math.min(4, totalPages - 1);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(totalPages - 3, 2);
      }

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  const getFinalJSON = () => {
    // it gets all that the person has finished
    const finalJSON: Record<string, string> = currentLanguageData ?? {};
    
    for (const key in modifiedTranslations) {
      if (modifiedTranslations[key].trim() === "") continue;
      
      finalJSON[key] = modifiedTranslations[key];
    }

    return finalJSON;
  };
  
  if (loading) return <div>Loading...</div>;

  return (
    <main className="w-full">
      <h1 className="text-3xl font-bold">
        Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}!
      </h1>
      <p className="mb-5">
        You are currently managing the {normalizedTranslations[selectedLanguage].EnglishName} translation.<br />
        Your changes will be saved automatically in the background.
      </p>

      <AlertDialog onOpenChange={(open) => setImportLanguageOpen(open)} open={importLanguageOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Language</AlertDialogTitle>
            <AlertDialogDescription>
              Import language data from JSON
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Editor
            height={300}
            language="json"
            theme="vs-dark"
            options={{
              minimap: { enabled: false }
            }}
            value={importedLanguageRaw}
            onChange={(newValue) => setImportedLanguageRaw(newValue ?? "")}
          />
          <p>{importedLanguageDataValid ? <span className="text-green-500 text-xs text-right">Valid JSON</span> : <span className="text-red-500 text-xs text-right">Invalid JSON ({importedLanguageDataError})</span>}</p>
          <div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled={!importedLanguageDataValid} onClick={() => {
                const importedData = JSON.parse(importedLanguageRaw);
                const existingData = currentLanguageData ?? {};
                
                for (const key in importedData) {
                  if (existingData[key] === importedData[key]) continue;
                  
                  const value = importedData[key];
                  existingData[key] = value;
                }

                setModifiedTranslations(existingData);
              }}>Import</AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={(open) => setClearTranslationsOpen(open)} open={clearTranslationsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Translations</AlertDialogTitle>
            <AlertDialogDescription>
              Clear current translations? This will permanently delete all modifications that you have made on this site. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant={"destructive"} disabled={clearTranslationTimeout > 0} onClick={() => {
              setModifiedTranslations({});
              localStorage.setItem(`modifiedTranslations-${selectedLanguage}`, JSON.stringify({}));
              setCurrentPage(1);
              setSearchTerm("");
              setClearTranslationsOpen(false);
            }}>Clear Translations {clearTranslationTimeout > 0 ? `(${clearTranslationTimeout}s)` : ""}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog onOpenChange={(open) => setPublishOpen(open)} open={publishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Publish & update the translations on GitHub as {session?.user?.name ?? "anonymous"}? You have changed over {Object.keys(modifiedTranslations).length} translations.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const finalData = getFinalJSON();
              const translations = Object.keys(finalData);
              for (const translation of translations) {
                if (!translation.includes('%s'))
                  continue;

                const translationValue = finalData[translation];

                const originalFormattedCount = translation.split('%s').length - 1;
                const newFormattedCount = translationValue.split('%s').length - 1;
                
                if (originalFormattedCount !== newFormattedCount) {
                  toast.error(`The translation '${translation}' Expected ${originalFormattedCount} '%s' but got ${newFormattedCount}.\nThe problematic translation was copied to clipboard.`);
                  navigator.clipboard.writeText(translation);
                  return;
                }
              }

              toast.promise(publish_translations(finalData, selectedLanguage), {
                loading: "Publishing changes...",
                success: (data) => {
                  if (!data || !data.success) {
                    throw new Error(JSON.stringify((data?.message ?? { message: { message: "Failed to publish!" } })));
                  }

                  const toastData: { message: string; description: string; action?: { label: string; onClick: () => void } } = {
                    message: data.message.message,
                    description: data.message.description,
                  };

                  if (data.message.action) {
                    toastData.action = {
                      label: data.message.action.label,
                      onClick: () => {
                        if (data.message.action && data.message.action.onClick === "OPEN_LINK") {
                          window.open(data.message.action.href);
                        } else {
                          if (data.message.action) {
                            console.error("Unknown action type:", data.message.action.onClick);
                          }
                        }
                      }
                    };
                  }

                  return toastData;
                },
                error: (error) => {
                  const errorData = JSON.parse(error.message);
                  
                  const toastData: { message: string; description: string; action?: { label: string; onClick: () => void } } = {
                    message: errorData.message.message,
                    description: errorData.message.description,
                  };

                  if (errorData.message.action) {
                    toastData.action = {
                      label: errorData.message.action.label,
                      onClick: () => {
                        if (errorData.message.action && errorData.message.action.onClick === "OPEN_LINK") {
                          window.open(errorData.message.action.href);
                        } else {
                          if (errorData.message.action) {
                            console.error("Unknown action type:", errorData.message.action.onClick);
                          }
                        }
                      }
                    };
                  }

                  return toastData;
                }
              });
            }}>Publish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-2">
            <CardTitle>Edit Translations</CardTitle>
            <CardDescription>
              {processing ? "Processing..." : (
                <>
                  You are missing <span className={cn("font-bold",
                    Object.keys(missingTranslations).length > 100 ? 'text-red-500' :
                    Object.keys(missingTranslations).length > 50 ? 'text-yellow-500' :
                    Object.keys(missingTranslations).length < 25 ? 'text-green-500' :
                    ''
                  )}>{Object.keys(missingTranslations).length}</span> translations.
                </>
              )}
              
            </CardDescription>
          </div>
          
          <div className="flex flex-row gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size={"sm"} disabled={selectedLanguage === "en"} variant={"outline"}>
                  Utility <HammerIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel className="flex flex-row gap-2">Testing <BugIcon /></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  const finalData = getFinalJSON();
                  const script = `writefile("${selectedLanguage}-dev.json", [[${JSON.stringify(finalData)}]])
  getgenv().environment = "translator_env"
  getgenv().overrideLanguage = "${selectedLanguage}"
  getgenv().language = {
      ["${selectedLanguage}"] = {
          NativeName = "${normalizedTranslations[selectedLanguage].NativeName}",
          EnglishName = "${normalizedTranslations[selectedLanguage].EnglishName}",
          Path = "${selectedLanguage}-dev.json"
      }
  }

  script_key="${key.trim() === "" ? "script key here" : key}";
  loadstring(game:HttpGet("https://api.luarmor.net/files/v3/loaders/002c19202c9946e6047b0c6e0ad51f84.lua"))()`
                  
                  navigator.clipboard.writeText(script);
                  toast.success("Copied test script to clipboard.");
                }}>
                  <Scroll />
                  Copy test script to clipboard
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => {
                  const finalData = getFinalJSON();
                  const script = `writefile("${selectedLanguage}-dev.json", [[${JSON.stringify(finalData)}]])
  getgenv().environment = "translator_env"
  getgenv().overrideLanguage = "${selectedLanguage}"
  getgenv().language = {
      ["${selectedLanguage}"] = {
          NativeName = "${normalizedTranslations[selectedLanguage].NativeName}",
          EnglishName = "${normalizedTranslations[selectedLanguage].EnglishName}",
          Path = "${selectedLanguage}-dev.json"
      }
  }

  script_key="${key.trim() === "" ? "script key here" : key}";
  loadstring(game:HttpGet("https://api.luarmor.net/files/v3/loaders/002c19202c9946e6047b0c6e0ad51f84.lua"))()`
                  
                  const blob = new Blob([script], {type: "text/plain;charset=utf-8"});
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `${selectedLanguage}-dev.lua`;
                  document.body.appendChild(link);
                  link.click();
                  toast.success("Downloaded test script.");
                }}>
                  <Scroll />
                  Download test script
                </DropdownMenuItem>

                <DropdownMenuLabel className="flex flex-row gap-2 mt-2">Translation Data <Languages /></DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(missingTranslations, null, 2));
                  toast.success("Copied missing translations to clipboard.");
                }}>
                  <MinusCircle />
                  Copy Missing Translations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const blob = new Blob([JSON.stringify(missingTranslations, null, 2)], { type: "application/json;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `${selectedLanguage}-missing.json`;
                  link.click();
                  toast.success("Downloaded missing translations successfully.");
                }}>
                  <DownloadIcon />
                  Download Missing Translations
                </DropdownMenuItem>

                <div className="mt-2" />

                <DropdownMenuItem onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(modifiedTranslations, null, 2));
                  toast.success("Copied current translations to clipboard.");
                }}>
                  <MinusCircle />
                  Copy Current Translations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const blob = new Blob([JSON.stringify(modifiedTranslations, null, 2)], { type: "application/json;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `${selectedLanguage}-edited.json`;
                  link.click();
                  toast.success("Downloaded current translations successfully.");
                }}>
                  <DownloadIcon />
                  Download Current Translations
                </DropdownMenuItem>

                <DropdownMenuLabel className="flex flex-row gap-2 mt-2">Utilities <HammerIcon /></DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => {setImportLanguageOpen(true)}}>
                  <DownloadIcon />
                  Import Translation
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => {setClearTranslationsOpen(true)}}>
                  <RefreshCcwIcon />
                  Clear Translations
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size={"sm"} disabled={selectedLanguage === "en"}>
                  Export/Publish Language <FileJsonIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel className="flex flex-row gap-2">Export <DownloadIcon /></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  const finalData = getFinalJSON();

                  const translations = Object.keys(finalData);
                  for (const translation of translations) {
                    if (!translation.includes('%s'))
                      continue;

                    const translationValue = finalData[translation];

                    const originalFormattedCount = translation.split('%s').length - 1;
                    const newFormattedCount = translationValue.split('%s').length - 1;
                    
                    console.log(translation, translationValue);
                    console.log(originalFormattedCount, newFormattedCount);
                    
                    if (originalFormattedCount !== newFormattedCount) {
                      toast.error(`The translation '${translation}' Expected ${originalFormattedCount} '%s' but got ${newFormattedCount}.\nThe problematic translation was copied to clipboard.`);
                      navigator.clipboard.writeText(translation);
                      return;
                    }
                  }

                  navigator.clipboard.writeText(JSON.stringify(finalData, null, 2));
                  toast.success("Copied final translations to clipboard.");
                }}>
                  <span className="text-red-300">[Strict]</span> Copy to clipboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const finalData = getFinalJSON();

                  const translations = Object.keys(finalData);
                  for (const translation of translations) {
                    const translationValue = finalData[translation];

                    const originalFormattedCount = translation.split('%s').length - 1;
                    const newFormattedCount = translationValue.split('%s').length - 1;
                    
                    if (originalFormattedCount !== newFormattedCount) {
                      toast.error(`The translation '${translation}' Expected ${originalFormattedCount} '%s' but got ${newFormattedCount}.\nThe problematic translation was copied to clipboard.`);
                      navigator.clipboard.writeText(translation);
                      return;
                    }
                  }

                  const blob = new Blob([JSON.stringify(finalData, null, 2)], {type: "application/json;charset=utf-8"});
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `${selectedLanguage}.json`;
                  document.body.appendChild(link);
                  link.click();
                }}>
                  <span className="text-red-300">[Strict]</span>
                  Save to file (.json)
                </DropdownMenuItem>
                <div className="mt-2" />
                <DropdownMenuItem onClick={() => {
                  const finalData = getFinalJSON();
                  navigator.clipboard.writeText(JSON.stringify(finalData, null, 2));
                  toast.success("Copied final translations to clipboard.");
                }}>
                  <span className="text-green-300">[Loose]</span>Copy to clipboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const finalData = getFinalJSON();
                  const blob = new Blob([JSON.stringify(finalData, null, 2)], {type: "application/json;charset=utf-8"});
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `${selectedLanguage}-loose.json`;
                  document.body.appendChild(link);
                  link.click();
                }}>
                  <span className="text-green-300">[Loose]</span>Save to file (.json)
                </DropdownMenuItem>

                <DropdownMenuLabel className="flex flex-row mt-2 gap-2">Publish <SendIcon /></DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => {
                  if (Object.keys(modifiedTranslations).length === 0) {
                    toast.error("You have not made any changes.");
                    return;
                  }

                  if (!session) {
                    toast.error("You must be logged in to publish changes. Go to the settings tab and log in.");
                    return;
                  }

                  setPublishOpen(true);
                }}>
                  <GithubIcon /> Publish changes to GitHub
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <div className="p-6">
          <Tabs defaultValue="missing" onValueChange={handleTabChange} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <TabsList>
                <TabsTrigger value="missing">Missing Translations</TabsTrigger>
                <TabsTrigger value="existing">Existing Translations</TabsTrigger>
              </TabsList>
              
              <div className="flex flex-row">
                {/* Search bar */}
                <div className="flex items-center border rounded-md pl-3 w-full max-sm:max-w-full max-w-md">
                  <Search className="h-4 w-4 text-muted-foreground mr-2" />
                  <Input
                    placeholder="Search translations..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <TabsContent value="missing">
                {!processing && (
                  <>
                    {currentTranslations.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {currentTranslations.map(([key, value]) => (
                          <div key={key} className="flex flex-row items-center gap-2 my-3">
                            <Textarea readOnly value={key} /> <ArrowRight className="flex-shrink-0" />
                            <Textarea
                              value={modifiedTranslations[key] ?? missingTranslations[key] ?? value}
                              onChange={(e) => handleModifiedTranslationChange(key, e.target.value)}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchTerm 
                          ? "No missing translations match your search term" 
                          : "No missing translations found"}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="existing">
                {currentLanguageDataLoading || currentLanguageData === undefined ? (
                  <div className="py-8 text-center">Loading...</div>
                ) : (
                  <>
                    {currentTranslations.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {currentTranslations.map(([key, value]) => (
                          <div key={`${key}-${selectedLanguage}`} className="flex flex-row items-center gap-2 my-3 w-full">
                            <Textarea readOnly value={key} className="w-full"/> <ArrowRight className="flex-shrink-0" />
                            <Textarea value={modifiedTranslations[key] ?? missingTranslations[key] ?? value} onChange={(e) => handleModifiedTranslationChange(key, e.target.value)} className="w-full" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        {searchTerm 
                          ? "No existing translations match your search term" 
                          : "No existing translations found"}
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        <div className="px-6 pb-6">
          {/* Pagination */}
          {filteredTranslations.length > itemsPerPage && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => {
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {generatePaginationItems()}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => {
                      if (currentPage < totalPages) handlePageChange(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
          
          <div className="flex flex-row items-center justify-between mt-4">
            {/* Results counter */}
            {!processing && filteredTranslations.length > 0 && (
              <div className="text-sm text-muted-foreground mt-4">
                Showing {Math.min(filteredTranslations.length, indexOfFirstItem + 1)}-
                {Math.min(indexOfLastItem, filteredTranslations.length)} of{" "}
                {filteredTranslations.length} results
              </div>
            )}

            <div className="flex flex-row items-center gap-2">
              <span className="text-muted-foreground text-xs">Items per page:</span>
              <Input
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                }}
                type="number"
                min={1}
                className="w-20 mr-2"
              />
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}