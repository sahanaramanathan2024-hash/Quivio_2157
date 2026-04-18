import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  useGetQuiz, 
  getGetQuizQueryKey, 
  useUpdateQuiz, 
  usePublishQuiz, 
  useDeleteQuiz,
  useUpdateQuestion,
  useDeleteQuestion,
  useGetQuizPerformance,
  getGetQuizPerformanceQueryKey,
  useCreateAttempt
} from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookOpen, Clock, Settings, PlayCircle, Trash2, Edit, AlertCircle, BarChart3, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";

export default function QuizDetail({ id: idParam }: { id: string }) {
  const id = parseInt(idParam, 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [isEditingQuestion, setIsEditingQuestion] = useState<number | null>(null);

  const { data: quiz, isLoading } = useGetQuiz(id, {
    query: {
      enabled: !!id,
      queryKey: getGetQuizQueryKey(id)
    }
  });

  const { data: performance } = useGetQuizPerformance(id, {
    query: {
      enabled: !!id && quiz?.status === "published" && quiz?.createdBy === user?.id,
      queryKey: getGetQuizPerformanceQueryKey(id)
    }
  });

  const updateQuiz = useUpdateQuiz();
  const publishQuiz = usePublishQuiz();
  const deleteQuiz = useDeleteQuiz();
  const createAttempt = useCreateAttempt();

  const isCreator = user?.id === quiz?.createdBy;

  const handlePublish = async () => {
    try {
      await publishQuiz.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetQuizQueryKey(id) });
      toast.success("Quiz published successfully");
    } catch (error) {
      toast.error("Failed to publish quiz");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteQuiz.mutateAsync({ id });
      toast.success("Quiz deleted");
      setLocation("/quizzes");
    } catch (error) {
      toast.error("Failed to delete quiz");
    }
  };

  const handleStartAttempt = async () => {
    try {
      const attempt = await createAttempt.mutateAsync({
        data: { quizId: id }
      });
      setLocation(`/quizzes/${id}/attempt?attemptId=${attempt.id}`);
    } catch (error) {
      toast.error("Failed to start attempt");
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!quiz) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold">Quiz Not Found</h2>
          <p className="text-muted-foreground mt-2 mb-6">The quiz you are looking for does not exist or you don't have access.</p>
          <Button onClick={() => setLocation("/quizzes")}>Back to Quizzes</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-card border rounded-xl p-6 shadow-sm">
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={quiz.status === "published" ? "default" : "secondary"} className="text-sm px-3 py-1">
                {quiz.status.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="capitalize text-sm px-3 py-1 bg-background">{quiz.difficulty}</Badge>
              <Badge variant="outline" className="capitalize text-sm px-3 py-1 bg-background">{quiz.questionType.replace('_', ' ')}</Badge>
            </div>
            
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">{quiz.title}</h1>
              <p className="text-lg text-muted-foreground font-medium">{quiz.topic}</p>
            </div>
            
            {quiz.description && (
              <p className="text-muted-foreground bg-muted/30 p-4 rounded-lg border">{quiz.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                {quiz.questionCount} Questions
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {quiz.duration} Minutes
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[200px]">
            {/* Take quiz — visible to everyone */}
            <Button
              size="lg"
              onClick={handleStartAttempt}
              disabled={createAttempt.isPending || quiz.questions?.length === 0}
              className="w-full gap-2 text-base font-bold rounded-xl shadow-lg"
              style={{ background: "linear-gradient(135deg, #10b8a6, #0d9488)", color: "white", border: "none" }}
            >
              <PlayCircle className="h-5 w-5" />
              {createAttempt.isPending ? "Starting…" : "Take Quiz"}
            </Button>

            {/* Creator-only controls */}
            {isCreator && (
              <>
                {quiz.status === "draft" && (
                  <Button
                    onClick={handlePublish}
                    variant="outline"
                    className="w-full gap-2 font-medium"
                    disabled={publishQuiz.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {publishQuiz.isPending ? "Publishing…" : "Publish Quiz"}
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full gap-2 font-medium">
                      <Trash2 className="h-4 w-4" />
                      Delete Quiz
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this quiz and all associated attempts. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {/* Performance Stats (Creator Only & Published) */}
        {isCreator && quiz.status === "published" && performance && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Total Attempts</p>
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold">{performance.totalAttempts}</div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Avg Score</p>
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold">{performance.averageScore.toFixed(1)}</div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Avg Percentage</p>
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold">{performance.averagePercentage.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium">Pass Rate</p>
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold">{performance.passRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Questions Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Questions</h2>
          </div>

          <div className="grid gap-6">
            {quiz.questions?.map((question, index) => (
              <QuestionCard 
                key={question.id} 
                question={question} 
                index={index} 
                isCreator={isCreator && quiz.status === "draft"} 
                quizId={id}
              />
            ))}
            
            {quiz.questions?.length === 0 && (
              <div className="text-center p-12 border rounded-xl bg-card border-dashed">
                <p className="text-muted-foreground">No questions found for this quiz.</p>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </AppLayout>
  );
}

function QuestionCard({ question, index, isCreator, quizId }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(question.questionText);
  const [editedCorrectAnswer, setEditedCorrectAnswer] = useState(question.correctAnswer);
  
  const queryClient = useQueryClient();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();

  let options = [];
  try {
    if (question.options) {
      options = JSON.parse(question.options);
    }
  } catch (e) {
    // Ignore parsing error
  }

  const handleSave = async () => {
    try {
      await updateQuestion.mutateAsync({
        id: question.id,
        data: {
          questionText: editedText,
          correctAnswer: editedCorrectAnswer
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetQuizQueryKey(quizId) });
      setIsEditing(false);
      toast.success("Question updated");
    } catch (error) {
      toast.error("Failed to update question");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteQuestion.mutateAsync({ id: question.id });
      queryClient.invalidateQueries({ queryKey: getGetQuizQueryKey(quizId) });
      toast.success("Question deleted");
    } catch (error) {
      toast.error("Failed to delete question");
    }
  };

  return (
    <Card className="overflow-hidden border-muted-foreground/20 transition-all hover:border-muted-foreground/40">
      <div className="bg-muted/30 px-6 py-3 border-b flex items-center justify-between">
        <span className="font-semibold text-sm tracking-wider text-muted-foreground">QUESTION {index + 1}</span>
        <Badge variant="outline" className="text-xs uppercase tracking-wider">{question.questionType.replace('_', ' ')}</Badge>
      </div>
      <CardContent className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question Text</Label>
              <Textarea 
                value={editedText} 
                onChange={(e) => setEditedText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            {question.questionType === "multiple_choice" && options.length > 0 && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="grid gap-2">
                  {options.map((opt: string, i: number) => (
                    <div key={i} className={`p-3 rounded-md border text-sm ${opt === question.correctAnswer ? 'border-green-500 bg-green-50/50 dark:bg-green-500/10' : 'bg-background'}`}>
                      <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Correct Answer</Label>
              <Input 
                value={editedCorrectAnswer} 
                onChange={(e) => setEditedCorrectAnswer(e.target.value)} 
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <Button onClick={handleSave} size="sm">Save Changes</Button>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-medium leading-relaxed">{question.questionText}</h3>
            
            {question.questionType === "multiple_choice" && options.length > 0 && (
              <div className="grid gap-3">
                {options.map((opt: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card text-sm">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            )}

            {isCreator && (
              <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-sm">
                <p className="font-semibold text-green-700 dark:text-green-400 mb-1">Correct Answer:</p>
                <p>{question.correctAnswer}</p>
                
                {question.explanation && (
                  <div className="mt-3">
                    <p className="font-semibold text-green-700 dark:text-green-400 mb-1">AI Explanation:</p>
                    <p className="text-muted-foreground">{question.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      {isCreator && !isEditing && (
        <CardFooter className="bg-muted/10 border-t px-6 py-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-8 gap-1.5">
            <Edit className="h-3.5 w-3.5" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Question</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove this question?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  );
}
