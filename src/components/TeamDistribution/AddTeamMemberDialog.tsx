import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';

interface AddTeamMemberDialogProps {
    onAdd: (name: string, hourlyRate: number, role?: string) => void;
}

const AddTeamMemberDialog = ({ onAdd }: AddTeamMemberDialogProps) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');

    const handleSubmit = () => {
        if (name.trim() && hourlyRate) {
            onAdd(name.trim(), parseFloat(hourlyRate), role.trim() || undefined);
            setName('');
            setRole('');
            setHourlyRate('');
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Team Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>
                        Add a new team member with their hourly rate for cost calculations.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g., John Smith"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="role">Role / Title (Optional)</Label>
                        <Input
                            id="role"
                            placeholder="e.g., Senior Designer"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="rate">Hourly Rate (USD)</Label>
                        <Input
                            id="rate"
                            type="number"
                            placeholder="e.g., 50"
                            value={hourlyRate}
                            onChange={(e) => setHourlyRate(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!name.trim() || !hourlyRate}>
                        Add Member
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddTeamMemberDialog;
