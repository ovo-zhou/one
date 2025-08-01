import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
export default function Prompt() {
  return (
    <>
      <Dialog>
        <DialogTrigger>
          <div className="leading-10">提示词配置</div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>agent 提示词配置?</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">角色</Label>
              <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="username-1">提示词</Label>
              <Textarea
                id="username-1"
                name="username"
                defaultValue="@peduarte"
              />
            </div>
          </div>
          <DialogFooter>
            <Button>保存</Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                取消
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
