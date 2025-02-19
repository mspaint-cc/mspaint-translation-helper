"use client";
import { useTranslation } from "@/components/translation-provider";
import { Input } from "@/components/ui/input";
import { ArrowRight, BugIcon, DownloadIcon, FileJsonIcon, Scroll, Search, X } from "lucide-react";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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


export default function Home() {
  const { 
    loading, 
    selectedLanguage, 
    normalizedTranslations, 
    currentLanguageData, 
    currentLanguageDataLoading, 
    latestTranslation 
  } = useTranslation();
  
  const [key, setKey] = React.useState("");

  const [missingTranslations, setMissingTranslations] = React.useState<Record<string, string>>({});
  const [processing, setProcessing] = React.useState<boolean>(true);
  
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [itemsPerPage] = React.useState<number>(10);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [activeTab, setActiveTab] = React.useState<string>("missing");

  const [lastModifiedTranslations, setLastModifiedTranslations] = React.useState<Record<string, string>>({});
  const [modifiedTranslations, setModifiedTranslations] = React.useState<Record<string, string>>({});
  
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
    const isDifferent = Object.keys(modifiedTranslations).some(
      key => modifiedTranslations[key] !== lastModifiedTranslations[key]
    );

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
    const missingTranslations: Record<string, string> = {};
    for (const key in latestTranslation) {
      if (currentLanguageData === undefined || currentLanguageData[key] === undefined) {
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

  const getFinalJSON = (mode: "strict" | "loose" = "strict") => {
    // it gets all the translations (even the ones that are missing)
    if (mode === "strict") {
      const finalJSON: Record<string, string> = latestTranslation ?? {};
      
      for (const key in currentLanguageData) {
        finalJSON[key] = currentLanguageData[key];
      }
  
      for (const key in modifiedTranslations) {
        finalJSON[key] = modifiedTranslations[key];
      }
      return finalJSON;
    }

    // it gets all that the person has finished
    const finalJSON: Record<string, string> = currentLanguageData ?? {};
    
    for (const key in modifiedTranslations) {
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size={"sm"} disabled={selectedLanguage === "en"}>
                Export/Test Language <FileJsonIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel className="flex flex-row gap-2">Testing <BugIcon /></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                const finalData = getFinalJSON("loose");
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
                const finalData = getFinalJSON("loose");
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
                
                const blob = new Blob([script], {type: "text/plain"});
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
              

              <DropdownMenuLabel className="flex flex-row gap-2 mt-2">Export <DownloadIcon /></DropdownMenuLabel>
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

                const blob = new Blob([JSON.stringify(finalData, null, 2)], {type: "application/json"});
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
                const finalData = getFinalJSON("loose");
                navigator.clipboard.writeText(JSON.stringify(finalData, null, 2));
                toast.success("Copied final translations to clipboard.");
              }}>
                <span className="text-green-300">[Loose]</span>Copy to clipboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const finalData = getFinalJSON("loose");
                const blob = new Blob([JSON.stringify(finalData, null, 2)], {type: "application/json"});
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${selectedLanguage}-loose.json`;
                document.body.appendChild(link);
                link.click();
              }}>
                <span className="text-green-300">[Loose]</span>Save to file (.json)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <div className="p-6">
          <Tabs defaultValue="missing" onValueChange={handleTabChange} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <TabsList>
                <TabsTrigger value="missing">Missing Translations</TabsTrigger>
                <TabsTrigger value="existing">Existing Translations</TabsTrigger>
              </TabsList>
              
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
          
          {/* Results counter */}
          {!processing && filteredTranslations.length > 0 && (
            <div className="text-sm text-muted-foreground mt-4">
              Showing {Math.min(filteredTranslations.length, indexOfFirstItem + 1)}-
              {Math.min(indexOfLastItem, filteredTranslations.length)} of{" "}
              {filteredTranslations.length} results
            </div>
          )}
        </div>
      </Card>
    </main>
  );
}