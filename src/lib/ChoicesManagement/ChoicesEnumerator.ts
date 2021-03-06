import {Debug} from '../Tools/Debug';
import {EventEmitter} from '../Tools/EventEmitter';

export type MultipleLabel = {
    [index: string]: string
};

/**
 * @typedef Choice
 */
export type Choice = {
    label: string,
    labels?: MultipleLabel,
    index: number,
    value: string | null,
    isFirst: () => boolean,
    isLast: () => boolean,
    data: Map<string, any>
};

export type CompletedChoice = Choice & {
    value: string,
};

export type EmptyChoice = Choice & {
    value: null,
};

/**
 * 
 * @alias ChoicesEnumerator
 * @extends EventEmitter
 */
export class ChoicesEnumerator extends EventEmitter
{
    /**
     * toute les étapes de la construction du configurateur
     * @type {Choice[]}
     * @public
     * @memberof ChoicesEnumerator
     */
    public choices: Choice[];

    /**
     * l'étape courante de la construction du configurateur
     * @type {Choice}
     * @public
     * @memberof ChoicesEnumerator
     */
    public current: Choice;

    /**
     * 
     * @param {string[]} choicesLabels liste des labels des différentes étapes du configurateur permet de générer les choix
     */
    constructor(choicesLabels: string[] | string[][])
    {
        super();

        if(!choicesLabels)
        {
            Debug.error(`data.choices not defined, you need to define choices in "onDataLoaded" the main class or in a dataFile`);
        }

        this.choices = [];

        Debug.info("choices Labels", choicesLabels);

        // Initialise tout les choix possibles
        for(let i = 0; i < choicesLabels.length; i++)
        {
            switch(typeof choicesLabels[i])
            {
                case 'string': 

                    this.choices[i] = {
                        label: choicesLabels[i] as string,
                        index: i,
                        value: null,
                        isFirst: () => (i === 0),
                        isLast: () => (i === this.choices.length -1),
                        data: new Map<string, any>()
                    };

                break;
                case 'object': 

                    this.choices[i] = {
                        label: (choicesLabels[i] as string[]).reduce((prev, curr) => `${prev}-${curr}`, ''),
                        labels: (choicesLabels[i] as string[]).reduce((prev, next) => {
                            prev[next] = next;
                            return prev;
                        }, {} as MultipleLabel),
                        index: i,
                        value: null,
                        isFirst: () => (i === 0),
                        isLast: () => (i === this.choices.length -1),
                        data: new Map<string, Map<string, any>>()
                    };

                    for(const choiceLabel of choicesLabels[i] as string[])
                    {
                        this.choices[i].data.set(choiceLabel, new Map<string, any>());
                    }

                break;
            }
        }

        this.current = this.choices[0];
    }

    /**
     * Contien le choix suivant (retourne l'actuel si il n'y a pas de suivant)
     * @type {Choice}
     * @public
     * @memberof ChoicesEnumerator
     */
    public get nextChoice() : Choice
    {
        if(this.current.index + 1 < this.choices.length)
        {
            return this.choices[this.current.index + 1];
        }

        return this.current;
    }

    /**
     * Contien le choix precedant (retourne l'actuel si il n'y a pas de precedant)
     * @returns {any}
     * @type {Choice}
     * @public
     * @memberof ChoicesEnumerator
     */
    public get previousChoice() : Choice
    {
        if(this.current.index - 1 >= 0)
        {
            return this.choices[this.current.index - 1];
        }

        return this.current;
    }

    /**
     * Fait ce déplacer le choix actuel vers un autre en fonction de sont index, réinitialise au passage les choix supérieurs
     * @param {number} index 
     * @public
     * @memberof ChoicesEnumerator
     */
    public next(value: string) : void
    {
        this.current.value = value;
        this.current = this.nextChoice;
        
        this.emit('change');

        if(this.isEnd())
        {
            this.emit('end');
        }
    }

    /**
     * Fait ce déplacer le choix actuel vers un autre en fonction de sont index, réinitialise au passage les choix supérieurs
     * @param {number} index 
     * @public
     * @memberof ChoicesEnumerator
     */
    public goTo(index: number) : void
    {
        if(index < 0 || index >= this.choices.length)
        {
            Debug.error('Index exceding choices size');
            return;
        }

        this.current = this.choices[index];

        for(let i = this.current.index; i < this.choices.length; i++)
        {
            this.choices[i].value = null;
        }
        
        this.emit('change');

        if(this.isEnd())
        {
            this.emit('end');
        }
    }

    /**
     * Permet de définir une donnée relié a un choix
     * @param {number} index 
     * @param {string} valueLabel 
     * @param {any} value 
     * @param {string} choiceLabel? pour ajouté une donnée a un label spécifique
     * @public
     * @memberof ChoicesEnumerator
     */
    public setData(index: number, valueLabel: string, value: any, choiceLabel?: string): void
    {
        if(index < 0 || index >= this.choices.length)
        {
            Debug.error('Index out choices size');
            return;
        }

        if(choiceLabel === undefined || !this.get(index).data.get(choiceLabel)?.set)
        {
            this.get(index).data.set(valueLabel, value);
        }
        else
        {
            // DEPRECATED
            /*for(const choiceDataByChoiceLabel of this.get(index).data.entries())
            {
                if(choiceDataByChoiceLabel[0] === choiceLabel) continue;

                Debug.info(choiceDataByChoiceLabel, choiceLabel, valueLabel)

                choiceDataByChoiceLabel[1]?.delete(valueLabel);
            }*/

            this.get(index).data.get(choiceLabel).set(valueLabel, value);
        }
    }

    /**
     * Permet de récupérer une donnée relié a un choix
     * @param {number|string} index 
     * @param {any} value 
     * @param {string} choiceLabel? pour récupérer une donnée a un label spécifique
     * @public
     * @memberof ChoicesEnumerator
     */
    public getData(index: number | string, valueLabel: string, choiceLabel?: string): any
    {
        let choice: Choice;        

        switch(typeof index)
        {
            case 'number': 
                choice = this.get(index);
            break;
            case 'string': 
                choice = this.getByLabel(index) as Choice;
            break;
        }

        if(choiceLabel === undefined || !choice.data.get(choiceLabel)?.get)
        {
            return choice.data.get(valueLabel);
        }
        else
        {
            return choice.data.get(choiceLabel)?.get(valueLabel);
        }
    }
        
    /**
     * Permets de définir la valeur d'un choix en fonction de sont index
     * @param {number} index
     * @param {string} value
     * @public
     * @memberof ChoicesEnumerator
     */
    public set(index : number, value : string) : void
    {
        if(index < 0 || index >= this.choices.length)
        {
            Debug.error('Index out choices size');
            return;
        }

        this.choices[index].value = value.toString();
    }

    /**
     * @returns true si le choix actuel est le dernier
     * @public
     * @memberof ChoicesEnumerator
     */
    public isEnd()
    {
        return (this.nextChoice == this.current);
    }

    /**
     * Permets de récupérer un choix en fonction de son label 
     * @param {string} label
     * @returns Le premier choix trouvé avec le label correspondant
     * @private
     * @memberof ChoicesEnumerator
     */
    public getByLabel(label : string) : Choice | undefined
    {
        return this.choices.find(choice => (choice.label === label || (choice.labels && choice.labels[label])));
    }

    /**
     * Permets de récupérer un choix en fonction de son index
     * @param {number} index
     * @public
     * @memberof ChoicesEnumerator
     */
    public get(index : number): Choice
    {
        return this.choices[index];
    }

    /**
     * Permets de récupérer le nombre de choix qui ont une valeur définie
     * @returns nombre de choix complété
     * @public
     * @memberof ChoicesEnumerator
     */
    public get completedCount(): number
    {
        let count = 0;
        for(const choice of this.choices)
        {
        if(choice.value) count++;
        }
        return count;
    }

    /**
     * Permets de récupérer tout les choix qui suivent le courant 
     * @returns tableau choix qui suivent le courant
     * @public
     * @memberof ChoicesEnumerator
     */
    public get nexts(): Choice[]
    {
        const choices: Choice[] = [];

        for(let i = this.current.index; i < this.choices.length; i++)
        {
            choices.push(this.choices[i]);
        }

        return choices;
    }

    /**
     * Permets de récupérer les choix qui ont une valeur définie
     * @returns tableau choix complété
     * @public
     * @memberof ChoicesEnumerator
     */
    public get completed(): CompletedChoice[]
    {
        const array = [];

        for(const choice of this.choices)
        {
            if(choice.value)
            {
                array.push(choice as CompletedChoice);
            }
        }

        return array;
    }

    /**
     * Permets de récupérer les choix qui n'ont pas de valeur définie
     * @returns tableau choix qui n'ont pas de valeur définie
     * @public
     * @memberof ChoicesEnumerator
     */
    public get notCompleted(): EmptyChoice[]
    {
        const array = [];

        for(const choice of this.choices)
        {
            if(!choice.value)
            {
                array.push(choice as EmptyChoice);
            }
        }

        return array;
    }
}