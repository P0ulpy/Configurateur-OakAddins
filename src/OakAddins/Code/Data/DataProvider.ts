import { ChoicesManager } from '../../../lib/ChoicesManagement/ChoicesManager';
import {DataProvider as _DataProvider} from '../../../lib/DataProvider';
import { Debug } from '../../../lib/Tools/Debug';
import { ChoiceData, TreeNode } from './DataParser';

export class DataProvider extends _DataProvider{

    constructor(choicesManager : ChoicesManager)
    {
        super(choicesManager);
    }

    public getChoiceData(choiceName: string): ChoiceData
    {
        if(!this.data?.config?.choices?.types[choiceName])
        {
            Debug.error(`no choiceData defined for "${choiceName}"`);
        }

        return this.data?.config?.choices?.types[choiceName] as ChoiceData;
    }

    public getCurrentNode(): TreeNode
    {
        const completedChoices = this.choicesEnumerator.completed;
        
        let node = this.data.tree;

        for(const choice of completedChoices)
        {
            if(node?.values[choice.value]?.next)
            {
                node = node.values[choice.value].next;
            }
            else if(node?.values[choice.value]?.rootNext)
            {
                node = node.next;
            }
            else
            {
                Debug.warn(`cant't next, no next or rootNext defined for choice "${choice.label}" value "${choice.value}"`, node);
            }
        }

        return node as TreeNode;
    }
}