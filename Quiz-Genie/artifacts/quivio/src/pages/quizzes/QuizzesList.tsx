import { useListQuizzes, getListQuizzesQueryKey } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, BookOpen, PlusCircle, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";

export default function QuizzesList() {
  const { data: quizzes, isLoading } = useListQuizzes(undefined, {
    query: {
      queryKey: getListQuizzesQueryKey()
    }
  });

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
            <p className="text-muted-foreground mt-1">Manage and explore assessments.</p>
          </div>
          <Link href="/quizzes/create">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Quiz
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="flex flex-col">
                <CardHeader>
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent className="flex-1">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-4/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : quizzes?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-card border-dashed">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <LayoutGrid className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No quizzes found</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              You haven't created any quizzes yet. Get started by creating your first AI-assisted quiz.
            </p>
            <Link href="/quizzes/create">
              <Button>Create your first quiz</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quizzes?.map((quiz, i) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="h-full"
              >
                <Card className="flex flex-col h-full hover:border-primary/50 transition-colors group">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <CardTitle className="line-clamp-2 leading-tight">{quiz.title}</CardTitle>
                      <Badge variant={quiz.status === "published" ? "default" : "secondary"}>
                        {quiz.status}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="capitalize">{quiz.difficulty}</Badge>
                      <span className="text-xs text-muted-foreground truncate">{quiz.topic}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {quiz.description || "No description provided."}
                    </p>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between border-t bg-muted/20 pt-4">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" />
                        {quiz.questionCount} Qs
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {quiz.duration} min
                      </div>
                    </div>
                    <Link href={`/quizzes/${quiz.id}`}>
                      <Button variant="ghost" size="sm" className="group-hover:bg-primary/10 group-hover:text-primary">
                        View
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
