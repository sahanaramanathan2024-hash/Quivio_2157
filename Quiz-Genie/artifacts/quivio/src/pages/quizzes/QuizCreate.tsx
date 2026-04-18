import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AppLayout from "@/components/layout/AppLayout";
import { useCreateQuiz, useGenerateQuizQuestions } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Wand2, FileText, Target, Upload, X, FileCheck } from "lucide-react";
import { toast } from "sonner";

const quizSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  topic: z.string().min(3, "Topic is required"),
  description: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questionCount: z.coerce.number().min(1).max(50),
  duration: z.coerce.number().min(1).max(180),
  questionType: z.enum(["multiple_choice", "short_answer", "mixed"]),
});

type QuizFormValues = z.infer<typeof quizSchema>;

export default function QuizCreate() {
  const [, setLocation] = useLocation();
  const createQuiz = useCreateQuiz();
  const generateQuestions = useGenerateQuizQuestions();
  const [isGenerating, setIsGenerating] = useState(false);

  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: "",
      topic: "",
      description: "",
      difficulty: "medium",
      questionCount: 10,
      duration: 15,
      questionType: "multiple_choice",
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") {
      setPdfFile(file);
    } else {
      toast.error("Please upload a PDF file.");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type === "application/pdf") {
      setPdfFile(file);
    } else if (file) {
      toast.error("Please upload a PDF file.");
    }
  };

  const getBaseUrl = () => {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    return base.replace(/\/__[^/]+$/, "");
  };

  const onSubmit = async (data: QuizFormValues) => {
    try {
      setIsGenerating(true);

      if (pdfFile) {
        // PDF-based quiz creation
        const formData = new FormData();
        formData.append("pdf", pdfFile);
        formData.append("title", data.title);
        formData.append("difficulty", data.difficulty);
        formData.append("questionCount", String(data.questionCount));
        formData.append("duration", String(data.duration));
        formData.append("questionType", data.questionType);

        const apiBase = getBaseUrl();
        const res = await fetch(`${apiBase}/api/quizzes/create-from-pdf`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(err.error || "Failed to create quiz from PDF");
        }

        const quiz = await res.json();
        toast.success("Quiz created from PDF!", { description: `Generated ${quiz.questionCount} questions.` });
        setLocation(`/quizzes/${quiz.id}`);
      } else {
        // Topic/text-based quiz creation
        const quiz = await createQuiz.mutateAsync({ data });
        toast.success("Quiz created", { description: "Now generating AI questions..." });

        await generateQuestions.mutateAsync({
          id: quiz.id,
          data: {
            count: data.questionCount,
            questionType: data.questionType as any,
            additionalContext: data.description,
          },
        });

        toast.success("Questions generated successfully!");
        setLocation(`/quizzes/${quiz.id}`);
      }
    } catch (error) {
      toast.error("Failed to create quiz", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        {/* Page header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-foreground mb-2">
            Create a New Quiz <span className="text-yellow-400">✨</span>
          </h1>
          <p className="text-muted-foreground text-base">
            Choose your preferred method to generate an AI-powered quiz
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* BY TOPIC card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-4 p-6 border-b border-gray-100">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #f97316, #fbbf24)" }}>
                  <Wand2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground uppercase tracking-wide">By Topic</h2>
                  <p className="text-sm text-muted-foreground">Enter a topic and let AI generate questions for you</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Quiz Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Midterm: Cellular Respiration" className="rounded-xl border-2 border-gray-200 focus:border-primary/50 h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Enter Your Topic</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., World War II, Photosynthesis, JavaScript Basics..." className="rounded-xl border-2 border-gray-200 focus:border-primary/50 h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* BY TEXT card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-4 p-6 border-b border-gray-100">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground uppercase tracking-wide">By Text</h2>
                  <p className="text-sm text-muted-foreground">Paste your text content and get relevant questions</p>
                </div>
              </div>
              <div className="p-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Enter Your Text (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste study material, notes, or any text content here..."
                          className="min-h-[110px] resize-y rounded-xl border-2 border-gray-200 focus:border-primary/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* BY MATERIALS (PDF) card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-4 p-6 border-b border-gray-100">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #10b8a6, #34d399)" }}>
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground uppercase tracking-wide">By Materials</h2>
                  <p className="text-sm text-muted-foreground">Upload your study material in PDF format</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm font-semibold text-foreground mb-3">Upload Your Material in PDF Format</p>

                {pdfFile ? (
                  /* File selected state */
                  <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-primary/40 bg-primary/5">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{pdfFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB · PDF
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setPdfFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  /* Drop zone */
                  <div
                    className={`rounded-xl border-2 border-dashed transition-all cursor-pointer p-8 flex flex-col items-center justify-center gap-3 ${
                      isDragging
                        ? "border-primary bg-primary/5 scale-[1.01]"
                        : "border-gray-300 bg-gray-50/50 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground text-sm">Click to upload PDF</p>
                      <p className="text-xs text-muted-foreground mt-1">or drag and drop · Max 10MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                )}

                {pdfFile && (
                  <p className="text-xs text-primary font-medium mt-3 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI will extract text from this PDF and generate questions automatically.
                  </p>
                )}
              </div>
            </div>

            {/* Settings card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-4 p-6 border-b border-gray-100">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #3b82f6, #60a5fa)" }}>
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-foreground uppercase tracking-wide">Quiz Settings</h2>
                  <p className="text-sm text-muted-foreground">Configure difficulty and format</p>
                </div>
              </div>
              <div className="p-6 grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Difficulty Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-2 border-gray-200 h-11">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Easy (Introductory)</SelectItem>
                          <SelectItem value="medium">Medium (Standard)</SelectItem>
                          <SelectItem value="hard">Hard (Advanced)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="questionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Question Format</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-2 border-gray-200 h-11">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="short_answer">Short Answer</SelectItem>
                          <SelectItem value="mixed">Mixed Format</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="questionCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Number of Questions</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={50} className="rounded-xl border-2 border-gray-200 h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold">Time Limit (Minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={180} className="rounded-xl border-2 border-gray-200 h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit button */}
            <div className="flex flex-col items-center gap-3">
              <Button
                type="submit"
                size="lg"
                disabled={isGenerating || createQuiz.isPending}
                className="px-12 h-13 text-base font-bold rounded-xl shadow-lg transition-all hover:scale-105 disabled:opacity-60 uppercase tracking-wide"
                style={{ background: "linear-gradient(135deg, #10b8a6, #0d9488)", color: "white", border: "none" }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {pdfFile ? "Processing PDF..." : "Generating via AI..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    + Create Quiz
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                AI will analyze your input and generate relevant questions automatically
              </p>
            </div>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
