import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '../ui/button';
import AgentCard from './AgentCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import AgentForm from './AgentForm';
import { useState } from 'react';
interface AgentProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  agentList: { id: number; agentName: string; prompt: string }[];
  queryAgent: () => Promise<void>;
}
export default function Agent(props: AgentProps) {
  const { isOpen, onOpenChange, agentList, queryAgent } = props;
  const [open, setOpen] = useState<boolean>(false);
  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Agent</SheetTitle>
            <SheetDescription>自定义 Agent 配置</SheetDescription>
          </SheetHeader>
          {agentList.map((agent) => {
            return (
              <AgentCard agent={agent} key={agent.id} queryAgent={queryAgent} />
            );
          })}
          <SheetFooter>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button type="submit">创建 Agent</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>新建</DialogTitle>
                  <DialogDescription>自定义 Agent 配置</DialogDescription>
                </DialogHeader>
                <AgentForm
                  handleCancel={() => {
                    setOpen(false);
                  }}
                  handleSubmit={() => {
                    setOpen(false);
                    queryAgent();
                  }}
                />
              </DialogContent>
            </Dialog>
            <SheetClose asChild>
              <Button variant="outline">关闭</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
