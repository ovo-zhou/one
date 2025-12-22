import { useState } from 'react';
import { Trash, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
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
} from '@/components/ui/alert-dialog';
import AgentForm from './AgentForm';

interface AgentCardProps {
  agent: { id: number; agentName: string; prompt: string };
  queryAgent: () => Promise<void>;
}

export default function AgentCard(props: AgentCardProps) {
  const { agent, queryAgent } = props;
  const { agentName, prompt, id } = agent;
  const [disabled, setDisabled] = useState(true);

  if (disabled) {
    return (
      <div className="px-4" key={id}>
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>{agentName}</ItemTitle>
            <ItemDescription className="text-wrap">{prompt}</ItemDescription>
          </ItemContent>
          <ItemActions className="cursor-pointer gap-3">
            <Pencil
              size={16}
              onClick={() => {
                setDisabled(false);
              }}
            />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Trash size={16} className="text-red-400" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除?</AlertDialogTitle>
                  <AlertDialogDescription>
                    删除后无法恢复
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await window.agent.deleteAgentPrompt(id);
                      await queryAgent();
                    }}
                  >
                    删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </ItemActions>
        </Item>
      </div>
    );
  }
  return (
    <div className="p-4" key={agent.id}>
      <Card className="w-full">
        <CardContent>
          <AgentForm
            agentName={agentName}
            prompt={prompt}
            id={id}
            handleSubmit={() => {
              setDisabled(true);
              queryAgent();
            }}
            handleCancel={() => {
              setDisabled(true);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
