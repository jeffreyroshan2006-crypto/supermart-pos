import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { User, Plus, Search } from 'lucide-react';
import { Customer } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface CustomerSelectorProps {
  customer: Customer | null;
  customerName: string;
  onSelect: (customer: Customer | null) => void;
}

export function CustomerSelector({ customer, customerName, onSelect }: CustomerSelectorProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', email: '' });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', 'search', search],
    queryFn: async () => {
      if (!search || search.length < 2) return [];
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(search)}`);
      if (!response.ok) throw new Error('Failed to search customers');
      return response.json() as Promise<Customer[]>;
    },
    enabled: search.length >= 2,
  });

  const handleCreateCustomer = async () => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerData),
      });
      
      if (response.ok) {
        const newCustomer = await response.json();
        onSelect(newCustomer);
        setShowNewCustomer(false);
        setNewCustomerData({ name: '', phone: '', email: '' });
        toast({ title: 'Customer created', description: `${newCustomer.name} added successfully` });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create customer', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-2">
      {customer ? (
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">{customer.name}</p>
              {customer.phone && <p className="text-xs text-muted-foreground">{customer.phone}</p>}
              {customer.loyaltyPoints > 0 && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {customer.loyaltyPoints} points
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
            Change
          </Button>
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2 glass-btn h-12">
              <User className="w-4 h-4" />
              <span className="text-muted-foreground">Add customer (C)...</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 glass-card" align="start">
            {showNewCustomer ? (
              <div className="p-4 space-y-3">
                <h4 className="font-semibold">New Customer</h4>
                <Input
                  placeholder="Name"
                  value={newCustomerData.name}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                  className="glass-input"
                />
                <Input
                  placeholder="Phone"
                  value={newCustomerData.phone}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                  className="glass-input"
                />
                <Input
                  placeholder="Email (optional)"
                  value={newCustomerData.email}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                  className="glass-input"
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowNewCustomer(false)}>
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 glass-btn-primary" 
                    onClick={handleCreateCustomer}
                    disabled={!newCustomerData.name}
                  >
                    Create
                  </Button>
                </div>
              </div>
            ) : (
              <Command>
                <CommandInput 
                  placeholder="Search customers..." 
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <CommandEmpty className="p-4 text-center">
                    <p className="text-muted-foreground mb-2">No customers found</p>
                    <Button size="sm" variant="outline" onClick={() => setShowNewCustomer(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New
                    </Button>
                  </CommandEmpty>
                  <CommandGroup>
                    {customers.map((cust) => (
                      <CommandItem
                        key={cust.id}
                        onSelect={() => {
                          onSelect(cust);
                          setOpen(false);
                          setSearch('');
                        }}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{cust.name}</p>
                          {cust.phone && <p className="text-xs text-muted-foreground">{cust.phone}</p>}
                        </div>
                        {cust.loyaltyPoints > 0 && (
                          <Badge variant="secondary">{cust.loyaltyPoints} pts</Badge>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
                <div className="p-2 border-t border-white/10">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center" 
                    onClick={() => setShowNewCustomer(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Customer
                  </Button>
                </div>
              </Command>
            )}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
